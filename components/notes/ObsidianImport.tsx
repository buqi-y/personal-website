"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NoteEditor, type NoteData } from "./NoteEditor";

interface ObsidianImportProps {
  onImport: (note: NoteData) => void;
}

/** Parse frontmatter from markdown content */
function parseFrontmatter(raw: string): {
  data: Record<string, string | string[]>;
  content: string;
} {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return { data: {}, content: raw.trim() };
  }

  const fmBlock = fmMatch[1];
  const content = raw.slice(fmMatch[0].length).trim();
  const data: Record<string, string | string[]> = {};

  for (const line of fmBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Handle array values like [tag1, tag2] or - tag1
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrContent = value.slice(1, -1);
      data[key] = arrContent
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    } else {
      // Remove surrounding quotes
      value = value.replace(/^['"]|['"]$/g, "");
      data[key] = value;
    }
  }

  return { data, content };
}

export function ObsidianImport({ onImport }: ObsidianImportProps) {
  const [fileSelectOpen, setFileSelectOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [parsedNote, setParsedNote] = useState<Partial<NoteData> | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".mdx")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selected = Array.from(e.target.files).filter(
          (f) => f.name.endsWith(".md") || f.name.endsWith(".mdx")
        );
        setFiles((prev) => [...prev, ...selected]);
      }
    },
    []
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportClick = useCallback(async () => {
    if (files.length === 0) return;

    // Read the first file (process one at a time)
    const file = files[0];
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.readAsText(file);
    });

    // Parse frontmatter
    const { data, content } = parseFrontmatter(text);

    // Extract title from frontmatter or filename
    const titleFromFile = file.name.replace(/\.(md|mdx)$/, "");
    const title = (data.title as string) || titleFromFile;

    // Extract category
    const category = (data.category as string) || "";

    // Extract tags
    let tags: string[] = [];
    if (Array.isArray(data.tags)) {
      tags = data.tags as string[];
    } else if (typeof data.tags === "string" && data.tags) {
      tags = [data.tags];
    }

    // Extract summary
    const summary = (data.summary as string) || (data.description as string) || content.slice(0, 100).replace(/\n/g, " ");

    // Extract date
    const date = (data.date as string) || new Date().toISOString().split("T")[0];

    // Calculate reading time
    const readingTime = `${Math.max(1, Math.ceil(content.length / 300))} min`;

    setParsedNote({
      id: Date.now().toString(),
      title,
      date,
      category,
      tags,
      summary,
      content,
      readingTime,
      source: "import",
    });

    setFileSelectOpen(false);
    setEditorOpen(true);
  }, [files]);

  const handleEditorSave = (note: NoteData) => {
    onImport(note);
    // Remove processed file from list
    setFiles((prev) => prev.slice(1));
    setParsedNote(undefined);
    setEditorOpen(false);
  };

  const handleEditorClose = (open: boolean) => {
    if (!open) {
      setParsedNote(undefined);
    }
    setEditorOpen(open);
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 gap-1.5"
        onClick={() => setFileSelectOpen(true)}
      >
        <Upload className="size-4" />
        导入笔记
      </Button>

      {/* File Selection Dialog */}
      <Dialog open={fileSelectOpen} onOpenChange={setFileSelectOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>导入 Obsidian 笔记</DialogTitle>
            <DialogDescription>
              支持 .md 文件，自动解析 frontmatter（标题、标签、分类等）
            </DialogDescription>
          </DialogHeader>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors
              ${
                isDragging
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
              }
            `}
          >
            <Upload className="size-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                拖拽文件到此处，或点击选择
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 .md、.mdx 文件
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.mdx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                已选择 {files.length} 个文件
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-2 text-sm text-foreground rounded-md px-2 py-1.5 bg-muted/50 group"
                  >
                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-foreground/10 transition-opacity"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import button */}
          <Button
            onClick={handleImportClick}
            disabled={files.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Upload className="size-4" />
            {files.length > 0
              ? `预览并导入第 1 个文件`
              : "选择文件后导入"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Preview Dialog using NoteEditor */}
      <NoteEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        initialData={parsedNote}
        onSave={handleEditorSave}
        mode="import"
      />
    </>
  );
}
