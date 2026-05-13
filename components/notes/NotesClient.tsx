"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Calendar, Plus, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ObsidianImport } from "./ObsidianImport";
import { NoteEditor, type NoteData } from "./NoteEditor";
import { notesApi } from "@/lib/api";
import type { NoteMeta } from "@/lib/mdx";

interface NoteItem extends NoteMeta {
  content?: string;
  isLocal?: boolean;
  source?: "local" | "import";
}

interface NotesClientProps {
  notes: NoteMeta[];
  categories: string[];
}

const categoryColors: Record<string, string> = {
  技术: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  设计: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  思考: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  随笔: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export function NotesClient({ notes: serverNotes, categories }: NotesClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [activeTag, setActiveTag] = useState<string>("");

  // Local notes from localStorage
  const [localNotes, setLocalNotes] = useState<NoteItem[]>([]);
  // Hidden notes (MDX notes user chose to hide)
  const [hiddenNotes, setHiddenNotes] = useState<string[]>([]);

  useEffect(() => {
    // 1. 先从 localStorage 快速加载
    try {
      const stored = window.localStorage.getItem("notes-items");
      if (stored) {
        setLocalNotes(JSON.parse(stored));
      }
      const hidden = window.localStorage.getItem("hidden-notes");
      if (hidden) {
        setHiddenNotes(JSON.parse(hidden));
      }
    } catch (e) {
      console.warn("Error reading notes from localStorage:", e);
    }

    // 2. 后台从 API 拉取最新，与本地数据合并而非覆盖
    notesApi.list().then((apiNotes) => {
      if (apiNotes && Array.isArray(apiNotes) && apiNotes.length > 0) {
        setLocalNotes((prevLocal) => {
          // 构建本地笔记 slug -> note 映射，用于保留 content 等字段
          const localMap = new Map(prevLocal.map((n) => [n.slug, n]));
          const apiMapped: NoteItem[] = apiNotes.map((n) => {
            const existing = localMap.get(n.slug);
            // 如果本地已有完整数据（含 content），优先保留本地版本，仅更新元数据
            if (existing && existing.content) {
              // API list 不包含 content，绝不能用 API 数据覆盖本地 content
              // tags: 只有当 API 返回非空 tags 时才更新，避免空数组覆盖本地标签
              return {
                ...existing,
                title: n.title || existing.title,
                date: n.date || existing.date,
                tags: (n.tags && n.tags.length > 0) ? n.tags : (existing.tags || []),
                summary: n.description || existing.summary || "",
                isLocal: true,
              };
            }
            // 本地无 content：保留本地已有字段，API list 数据仅补充元数据
            return {
              slug: n.slug,
              title: n.title || existing?.title || "",
              date: n.date || existing?.date || "",
              tags: (n.tags && n.tags.length > 0) ? n.tags : (existing?.tags || []),
              category: existing?.category || "",
              summary: n.description || existing?.summary || "",
              readingTime: existing?.readingTime || "",
              content: existing?.content || "",  // 保留本地已有的 content，确保不为 undefined
              isLocal: true,
              source: existing?.source || ("local" as const),
            };
          });
          // 合并逻辑：API 中有的更新（保留本地 content），本地有但 API 没有的保留
          const apiSlugs = new Set(apiMapped.map((n) => n.slug));
          const localOnly = prevLocal.filter((n) => !apiSlugs.has(n.slug));
          const merged = [...apiMapped, ...localOnly];
          window.localStorage.setItem("notes-items", JSON.stringify(merged));
          return merged;
        });
      }
    }).catch((err) => {
      console.warn("Failed to fetch notes from API, using cache:", err);
    });
  }, []);

  const saveLocalNotes = (notes: NoteItem[]) => {
    setLocalNotes(notes);
    try {
      window.localStorage.setItem("notes-items", JSON.stringify(notes));
    } catch (e) {
      console.warn("Error saving notes to localStorage:", e);
    }
    // 同步到 API（逐个保存最新的）
  };

  const saveHiddenNotes = (slugs: string[]) => {
    setHiddenNotes(slugs);
    try {
      window.localStorage.setItem("hidden-notes", JSON.stringify(slugs));
    } catch (e) {
      console.warn("Error saving hidden notes:", e);
    }
  };

  // Merge server and local notes, filter out hidden
  const allNotes: NoteItem[] = useMemo(() => {
    const localSlugs = new Set(localNotes.map((n) => n.slug));
    const merged: NoteItem[] = [
      ...localNotes.map((n) => ({ ...n, isLocal: true })),
      ...serverNotes
        .filter((n) => !localSlugs.has(n.slug) && !hiddenNotes.includes(n.slug))
        .map((n) => ({ ...n, isLocal: false })),
    ];
    return merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [serverNotes, localNotes, hiddenNotes]);

  // Editor states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingNoteData, setEditingNoteData] = useState<Partial<NoteData> | undefined>(undefined);

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);

  const allCategories = useMemo(() => {
    const cats = new Set([...categories, ...localNotes.map((n) => n.category).filter(Boolean)]);
    return ["全部", ...Array.from(cats)];
  }, [categories, localNotes]);

  // Enhanced search: matches title, summary, content, tags
  const filteredNotes = useMemo(() => {
    return allNotes.filter((note) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        note.title.toLowerCase().includes(searchLower) ||
        note.summary.toLowerCase().includes(searchLower) ||
        (note.content && note.content.toLowerCase().includes(searchLower)) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesCategory =
        activeCategory === "全部" || note.category === activeCategory;

      const matchesTag =
        activeTag === "" || note.tags.includes(activeTag);

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [allNotes, search, activeCategory, activeTag]);

  // CRUD handlers
  const handleCreate = () => {
    setEditingNoteData({
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      source: "local",
    });
    setEditorMode("create");
    setEditorOpen(true);
  };

  const handleEdit = (note: NoteItem) => {
    setEditingNoteData({
      id: note.slug,
      title: note.title,
      date: note.date,
      category: note.category,
      tags: note.tags,
      summary: note.summary,
      content: note.content || "",
      source: (note.source as "local" | "import") || "local",
    });
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleEditorSave = (note: NoteData) => {
    const noteItem: NoteItem = {
      slug: note.id,
      title: note.title,
      date: note.date,
      category: note.category,
      tags: note.tags,
      summary: note.summary,
      readingTime: note.readingTime,
      content: note.content,
      isLocal: true,
      source: note.source,
    };

    const existsInLocal = localNotes.find((n) => n.slug === noteItem.slug);
    if (existsInLocal) {
      saveLocalNotes(localNotes.map((n) => (n.slug === noteItem.slug ? noteItem : n)));
    } else {
      saveLocalNotes([noteItem, ...localNotes]);
    }

    // 同步到 API
    try {
      notesApi.save(noteItem.slug, {
        slug: noteItem.slug,
        title: noteItem.title,
        content: noteItem.content || "",
        date: noteItem.date,
        tags: noteItem.tags,
        description: noteItem.summary,
      }).catch((err) => {
        console.warn("Failed to save note to API:", err);
      });
    } catch (err) {
      console.warn("Failed to save note to API:", err);
    }
  };

  const handleImportNote = (note: NoteData) => {
    const noteItem: NoteItem = {
      slug: `import-${note.id}`,
      title: note.title,
      date: note.date,
      category: note.category,
      tags: note.tags,
      summary: note.summary,
      readingTime: note.readingTime,
      content: note.content,
      isLocal: true,
      source: "import",
    };
    saveLocalNotes([noteItem, ...localNotes]);

    // 同步导入的笔记到 API，确保 API 也有该笔记
    notesApi.save(noteItem.slug, {
      slug: noteItem.slug,
      title: noteItem.title,
      content: noteItem.content || "",
      date: noteItem.date,
      tags: noteItem.tags,
      description: noteItem.summary,
    }).catch((err) => {
      console.warn("Failed to sync imported note to API:", err);
    });
  };

  const handleDeleteClick = (note: NoteItem) => {
    setDeletingNote(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingNote) return;

    if (deletingNote.isLocal) {
      // Remove from local notes
      saveLocalNotes(localNotes.filter((n) => n.slug !== deletingNote.slug));
      // 同步删除到 API
      notesApi.remove(deletingNote.slug).catch((err) => {
        console.warn("Failed to delete note from API:", err);
      });
    } else {
      // Hide MDX note
      saveHiddenNotes([...hiddenNotes, deletingNote.slug]);
    }
    setDeleteDialogOpen(false);
    setDeletingNote(null);
  };

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setActiveTag("");
    } else {
      setActiveTag(tag);
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

  const clearTagFilter = () => {
    setActiveTag("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">笔记</h1>
          <p className="text-muted-foreground mt-2">记录学习与思考</p>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索笔记标题、内容、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <ObsidianImport onImport={handleImportNote} />
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus className="size-4" />
            新建笔记
          </Button>
        </div>
      </motion.div>

      {/* Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                activeCategory === cat
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Active tag filter indicator */}
      {activeTag && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <span className="text-xs text-muted-foreground">标签筛选:</span>
          <Badge variant="secondary" className="gap-1 pr-1">
            {activeTag}
            <button
              onClick={clearTagFilter}
              className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="size-3" />
            </button>
          </Badge>
        </motion.div>
      )}

      {/* Search result count */}
      {(search || activeTag) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mb-4"
        >
          找到 {filteredNotes.length} 篇笔记
        </motion.div>
      )}

      {/* Notes list */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              没有找到相关笔记
            </motion.div>
          ) : (
            filteredNotes.map((note, index) => (
              <motion.div
                key={note.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.05 * Math.min(index, 10) }}
                layout
                className="relative group"
              >
                {/* Action buttons */}
                <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                  {note.isLocal && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/20 text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(note);
                    }}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-destructive/20 text-foreground transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <Link
                  href={`/notes/${note.slug}`}
                  className="block"
                >
                  <div className="glass rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 hover:border-white/15">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Date */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0 sm:min-w-[60px] shrink-0">
                        <Calendar className="size-3.5 text-muted-foreground sm:hidden" />
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDate(note.date)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {note.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                          {note.summary}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
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
                          {note.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[11px] px-2 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTagClick(tag);
                              }}
                            >
                              #{tag}
                            </Badge>
                          ))}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {note.readingTime}
                          </span>
                          {note.source === "import" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-purple-400 border-purple-500/20">
                              导入
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Note Editor Dialog */}
      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={editingNoteData}
        onSave={handleEditorSave}
        mode={editorMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deletingNote?.isLocal
              ? "确定要删除这篇笔记吗？此操作不可撤销。"
              : "确定要隐藏这篇笔记吗？隐藏后不再显示在列表中。"}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {deletingNote?.isLocal ? "删除" : "隐藏"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
