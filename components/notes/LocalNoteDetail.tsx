"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Pencil, Calendar, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoteEditor, type NoteData } from "./NoteEditor";

interface LocalNote {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  readingTime: string;
  source?: string;
  isLocal?: boolean;
}

const categoryColors: Record<string, string> = {
  技术: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  设计: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  思考: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  随笔: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export default function LocalNoteDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const [note, setNote] = useState<LocalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notes-items");
      if (stored) {
        const notes: LocalNote[] = JSON.parse(stored);
        const found = notes.find((n) => n.slug === slug);
        setNote(found || null);
      }
    } catch (e) {
      console.warn("Error reading note from localStorage:", e);
    }
    setLoading(false);
  }, [slug]);

  const handleEditorSave = (updatedNote: NoteData) => {
    try {
      const stored = localStorage.getItem("notes-items");
      if (stored) {
        const notes: LocalNote[] = JSON.parse(stored);
        const updatedNotes = notes.map((n) =>
          n.slug === slug
            ? {
                ...n,
                title: updatedNote.title,
                date: updatedNote.date,
                category: updatedNote.category,
                tags: updatedNote.tags,
                summary: updatedNote.summary,
                content: updatedNote.content,
                readingTime: updatedNote.readingTime,
              }
            : n
        );
        localStorage.setItem("notes-items", JSON.stringify(updatedNotes));
        // Update local state
        const refreshed = updatedNotes.find((n) => n.slug === slug);
        setNote(refreshed || null);
      }
    } catch (e) {
      console.warn("Error saving note:", e);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          返回笔记列表
        </Link>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            笔记未找到
          </h2>
          <p className="text-muted-foreground">
            该笔记可能已被删除或不存在
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back button */}
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        返回笔记列表
      </Link>

      {/* Article header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">{note.title}</h1>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setEditorOpen(true)}
          >
            <Pencil className="size-3.5" />
            编辑
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {new Date(note.date).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {note.readingTime}
          </span>
          {note.category && (
            <Badge
              className={`text-[11px] px-2 py-0.5 border ${
                categoryColors[note.category] ??
                "bg-muted text-muted-foreground border-border"
              }`}
            >
              {note.category}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Tag className="size-3.5 text-muted-foreground" />
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[11px] text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Markdown Content */}
      <article className="glass rounded-xl p-6 sm:p-8">
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-li:text-foreground/85">
          <ReactMarkdown>{note.content || ""}</ReactMarkdown>
        </div>
      </article>

      {/* Note Editor Dialog */}
      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={{
          id: note.slug,
          title: note.title,
          date: note.date,
          category: note.category,
          tags: note.tags,
          summary: note.summary,
          content: note.content || "",
          source: (note.source as "local" | "import") || "local",
        }}
        onSave={handleEditorSave}
        mode="edit"
      />
    </div>
  );
}
