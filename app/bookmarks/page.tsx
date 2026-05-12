"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TagManager } from "@/components/shared/TagManager";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { bookmarksApi } from "@/lib/api";
import bookmarksData from "@/content/bookmarks.json";

interface Bookmark {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
}

const DEFAULT_TAGS = ["全部", "工具", "文章", "灵感", "资源"];

const emptyBookmark: Bookmark = {
  id: "",
  name: "",
  description: "",
  url: "",
  icon: "#6366f1",
  category: "",
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(
    "bookmarks-items",
    bookmarksData as Bookmark[]
  );
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [activeTag, setActiveTag] = useState("全部");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark>(emptyBookmark);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 从 API 拉取最新数据
  useEffect(() => {
    bookmarksApi.get().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped: Bookmark[] = data.map((item) => ({
          id: item.id,
          name: item.title || "",
          description: item.description || "",
          url: item.url || "",
          icon: item.icon || "#6366f1",
          category: item.category || "",
        }));
        setBookmarks(mapped);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBookmarks = useMemo(() => {
    if (activeTag === "全部") return bookmarks;
    return bookmarks.filter((b) => b.category === activeTag);
  }, [bookmarks, activeTag]);

  const handleTagAdd = (tag: string) => {
    setTags((prev) => [...prev, tag]);
  };

  const handleTagDelete = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    if (activeTag === tag) setActiveTag("全部");
  };

  // CRUD handlers
  const handleCreate = () => {
    setEditingBookmark({ ...emptyBookmark, id: Date.now().toString() });
    setEditDialogOpen(true);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark({ ...bookmark });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingBookmark.name.trim()) return;
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.id === editingBookmark.id);
      let newBookmarks: Bookmark[];
      if (exists) {
        newBookmarks = prev.map((b) => (b.id === editingBookmark.id ? editingBookmark : b));
      } else {
        newBookmarks = [editingBookmark, ...prev];
      }
      // 同步到 API
      bookmarksApi.update(newBookmarks.map((b) => ({
        id: b.id,
        title: b.name,
        url: b.url,
        description: b.description,
        icon: b.icon,
        category: b.category,
      }))).catch((err) => console.warn('Sync failed:', err));
      return newBookmarks;
    });
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setBookmarks((prev) => {
        const newBookmarks = prev.filter((b) => b.id !== deletingId);
        // 同步到 API
        bookmarksApi.update(newBookmarks.map((b) => ({
          id: b.id,
          title: b.name,
          url: b.url,
          description: b.description,
          icon: b.icon,
          category: b.category,
        }))).catch((err) => console.warn('Sync failed:', err));
        return newBookmarks;
      });
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">收藏</h1>
          <p className="mt-2 text-muted-foreground">值得分享的网站和资源</p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="size-4" />
          添加收藏
        </Button>
      </motion.div>

      {/* Tag Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-10"
      >
        <TagManager
          tags={tags}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          onTagAdd={handleTagAdd}
          onTagDelete={handleTagDelete}
          undeletableTags={DEFAULT_TAGS}
        />
      </motion.div>

      {/* Bookmarks Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTag}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredBookmarks.map((bookmark, index) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
              className="relative group"
            >
              {/* Action buttons */}
              <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(bookmark); }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/20 text-foreground transition-colors"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingId(bookmark.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-destructive/20 text-foreground transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block glass rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* External Link Icon */}
                <ExternalLink className="absolute right-3 top-3 size-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary group-hover:opacity-0" />

                {/* Icon */}
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: bookmark.icon }}
                >
                  <Globe className="size-5 text-white/90" />
                </div>

                {/* Name */}
                <h3 className="pr-5 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {bookmark.name}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {bookmark.description}
                </p>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredBookmarks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 text-center text-muted-foreground"
        >
          暂无相关收藏
        </motion.div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {bookmarks.find((b) => b.id === editingBookmark.id) ? "编辑收藏" : "添加收藏"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">名称</Label>
              <Input
                value={editingBookmark.name}
                onChange={(e) =>
                  setEditingBookmark((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="网站或资源名称"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">描述</Label>
              <Textarea
                value={editingBookmark.description}
                onChange={(e) =>
                  setEditingBookmark((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="简短描述"
                className="bg-muted/50 min-h-16"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">链接 URL</Label>
              <Input
                value={editingBookmark.url}
                onChange={(e) =>
                  setEditingBookmark((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">图标颜色</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editingBookmark.icon}
                  onChange={(e) =>
                    setEditingBookmark((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{editingBookmark.icon}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">分类</Label>
              <Input
                value={editingBookmark.category}
                onChange={(e) =>
                  setEditingBookmark((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="工具/文章/灵感/资源"
                className="bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
