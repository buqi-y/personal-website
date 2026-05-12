"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  X, Bold, Italic, Heading1, Heading2, Link2, Code2, List,
  Undo2, Redo2, Eye, Edit3, Columns2, Save, Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface NoteData {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  readingTime: string;
  source: "local" | "import";
}

interface NoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<NoteData>;
  onSave: (note: NoteData) => void;
  mode?: "create" | "edit" | "import";
}

type ViewMode = "edit" | "preview" | "split";

const CATEGORIES = ["技术", "设计", "随笔", "思考"];
const MAX_HISTORY = 50;
const DRAFT_DEBOUNCE = 5000;
const HISTORY_DEBOUNCE = 300;

export function NoteEditor({
  open,
  onOpenChange,
  initialData,
  onSave,
  mode = "create",
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [content, setContent] = useState(initialData?.content || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  // History (undo/redo)
  const [history, setHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUndoRedoRef = useRef(false);

  // Draft state
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const noteId = initialData?.id || "new";

  // Reset form when open/initialData changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (open) {
      const initialContent = initialData?.content || "";
      setTitle(initialData?.title || "");
      setCategory(initialData?.category || "");
      setCustomCategory("");
      setTags(initialData?.tags || []);
      setNewTag("");
      setSummary(initialData?.summary || "");
      setContent(initialContent);
      setViewMode("edit");
      setHistory([initialContent]);
      setHistoryIndex(0);

      // Check for draft
      const draftKey = `note-draft-${initialData?.id || "new"}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && savedDraft !== initialContent) {
        setDraftContent(savedDraft);
        setShowDraftBanner(true);
      } else {
        setShowDraftBanner(false);
        setDraftContent(null);
      }
    }
  }, [open, initialData]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  // Push to history (debounced)
  const pushHistory = useCallback((newContent: string) => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        const updated = [...trimmed, newContent];
        if (updated.length > MAX_HISTORY) updated.shift();
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    }, HISTORY_DEBOUNCE);
  }, [historyIndex]);

  // Auto-save draft (debounced 5s)
  const scheduleDraftSave = useCallback((newContent: string) => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draftKey = `note-draft-${noteId}`;
      localStorage.setItem(draftKey, newContent);
    }, DRAFT_DEBOUNCE);
  }, [noteId]);

  // Content change handler
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (!isUndoRedoRef.current) {
      pushHistory(newContent);
      scheduleDraftSave(newContent);
    }
    isUndoRedoRef.current = false;
  }, [pushHistory, scheduleDraftSave]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      isUndoRedoRef.current = true;
      setContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      isUndoRedoRef.current = true;
      setContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Restore draft
  const handleRestoreDraft = () => {
    if (draftContent) {
      handleContentChange(draftContent);
      setShowDraftBanner(false);
      setDraftContent(null);
    }
  };

  // Dismiss draft
  const handleDismissDraft = () => {
    setShowDraftBanner(false);
    setDraftContent(null);
    const draftKey = `note-draft-${noteId}`;
    localStorage.removeItem(draftKey);
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const insertMarkdown = useCallback((prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      prefix +
      (selectedText || "文本") +
      suffix +
      content.substring(end);

    handleContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + (selectedText || "文本").length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, handleContentChange]);

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
      return;
    }

    if (isCtrl && e.key === "b") {
      e.preventDefault();
      insertMarkdown("**", "**");
      return;
    }
    if (isCtrl && e.key === "i") {
      e.preventDefault();
      insertMarkdown("*", "*");
      return;
    }
    if (isCtrl && e.key === "k") {
      e.preventDefault();
      insertMarkdown("[", "](url)");
      return;
    }
    if (isCtrl && e.key === "e") {
      e.preventDefault();
      insertMarkdown("`", "`");
      return;
    }
    if (isCtrl && e.key === "s") {
      e.preventDefault();
      handleSave();
      return;
    }
    if (isCtrl && e.shiftKey && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      handleRedo();
      return;
    }
    if (isCtrl && e.key === "z") {
      e.preventDefault();
      handleUndo();
      return;
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const finalCategory = customCategory.trim() || category;
    const finalSummary = summary.trim() || content.slice(0, 100).replace(/\n/g, " ");
    const readingTime = `${Math.max(1, Math.ceil(content.length / 300))} min`;

    const note: NoteData = {
      id: initialData?.id || Date.now().toString(),
      title: title.trim(),
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: finalCategory,
      tags,
      summary: finalSummary,
      content,
      readingTime,
      source: initialData?.source || (mode === "import" ? "import" : "local"),
    };

    // Clear draft on successful save
    const draftKey = `note-draft-${noteId}`;
    localStorage.removeItem(draftKey);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    onSave(note);
    onOpenChange(false);
  };

  // Status bar stats
  const stats = useMemo(() => {
    const charCount = content.length;
    const lines = content ? content.split("\n").length : 0;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readMin = Math.max(1, Math.ceil(words / 200));
    return { charCount, words, lines, readMin };
  }, [content]);

  const dialogTitle = mode === "import" ? "导入笔记预览" : mode === "edit" ? "编辑笔记" : "新建笔记";

  const dialogSizeClass = viewMode === "split" ? "sm:max-w-7xl" : "sm:max-w-5xl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogSizeClass} max-h-[90vh] overflow-y-auto transition-all duration-300`}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{dialogTitle}</DialogTitle>
        </DialogHeader>

        {/* Draft recovery banner */}
        {showDraftBanner && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200">
            <span>检测到自动保存的草稿</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/20" onClick={handleRestoreDraft}>
                恢复
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-amber-500/10" onClick={handleDismissDraft}>
                忽略
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">标题</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入笔记标题"
              className="bg-muted/50"
            />
          </div>

          {/* Category + Tags row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">分类</Label>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCustomCategory("");
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">选择分类</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  if (e.target.value) setCategory("");
                }}
                placeholder="或输入自定义分类"
                className="bg-muted/50"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">标签</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签后回车"
                  className="bg-muted/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                  添加
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">摘要</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="输入笔记摘要（可选，不填则自动从正文截取）"
              className="bg-muted/50 min-h-[72px] resize-none"
              rows={3}
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">正文内容（Markdown）</Label>
              {/* View mode toggle */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50 border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="编辑模式"
                >
                  <Edit3 className="size-3" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="预览模式"
                >
                  <Eye className="size-3" />
                  预览
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${viewMode === "split" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="分屏模式"
                >
                  <Columns2 className="size-3" />
                  分屏
                </button>
              </div>
            </div>

            {/* Toolbar - shown in edit and split modes */}
            {viewMode !== "preview" && (
              <div className="flex items-center gap-1 p-1.5 rounded-t-lg border border-b-0 border-border bg-muted/30">
                {/* Format group */}
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="粗体 (Ctrl+B)"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="斜体 (Ctrl+I)"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("`", "`")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="行内代码 (Ctrl+E)"
                >
                  <Code className="size-3.5" />
                </button>

                <div className="w-px h-4 bg-border mx-1" />

                {/* Structure group */}
                <button
                  type="button"
                  onClick={() => insertMarkdown("# ", "")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="一级标题"
                >
                  <Heading1 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ", "")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="二级标题"
                >
                  <Heading2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("[", "](url)")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="链接 (Ctrl+K)"
                >
                  <Link2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("```\n", "\n```")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="代码块"
                >
                  <Code2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("- ", "")}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="列表"
                >
                  <List className="size-3.5" />
                </button>

                <div className="w-px h-4 bg-border mx-1" />

                {/* Action group */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="重做 (Ctrl+Shift+Z)"
                >
                  <Redo2 className="size-3.5" />
                </button>

                <div className="w-px h-4 bg-border mx-1" />

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="flex items-center justify-center h-7 w-7 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="保存 (Ctrl+S)"
                >
                  <Save className="size-3.5" />
                </button>
              </div>
            )}

            {/* Editor area */}
            <div className={`${viewMode === "split" ? "grid grid-cols-2 gap-0" : ""} transition-all duration-200`}>
              {/* Textarea - shown in edit and split modes */}
              {viewMode !== "preview" && (
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={"在此编写笔记内容...\n\n支持 Markdown 语法"}
                  className={`bg-muted/50 min-h-[500px] font-mono text-sm resize-y ${
                    viewMode === "edit" ? "rounded-t-none border-t-0" : "rounded-t-none rounded-r-none border-t-0 border-r-0"
                  }`}
                />
              )}

              {/* Preview - shown in preview and split modes */}
              {viewMode !== "edit" && (
                <div className={`min-h-[500px] overflow-y-auto p-4 border border-border bg-muted/20 ${
                  viewMode === "preview" ? "rounded-lg" : "rounded-tr-none rounded-bl-none border-t-0"
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-li:text-foreground/85">
                    {content ? (
                      <ReactMarkdown>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground/50 italic">预览区域 - 开始编辑即可看到渲染效果</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-4 px-3 py-1.5 rounded-b-lg border border-t-0 border-border bg-muted/20 text-xs text-muted-foreground">
              <span>{stats.charCount} 字符</span>
              <span>{stats.words} 字</span>
              <span>{stats.lines} 行</span>
              <span>预计阅读 {stats.readMin} 分钟</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {mode === "import" ? "确认导入" : "保存笔记"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
