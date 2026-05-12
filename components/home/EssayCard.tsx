"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { settingsApi } from "@/lib/api";

interface EssayItem {
  text: string;
  date: string;
  source: string;
}

const STORAGE_KEY = "essay-items";

const defaultEssays: EssayItem[] = [
  { text: "代码是诗，每一行都在讲述逻辑的故事。", date: "2024-01-10", source: "随想" },
  { text: "今天学到了一个新的设计模式，感觉思路豁然开朗。", date: "2024-01-12", source: "学习笔记" },
  { text: "好的产品不是功能的堆砌，而是体验的流动。", date: "2024-01-14", source: "产品思考" },
  { text: "记录生活中那些微小但闪闪发光的瞬间。", date: "2024-01-15", source: "生活感悟" },
];

function getStoredEssays(): EssayItem[] {
  if (typeof window === "undefined") return defaultEssays;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as EssayItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return defaultEssays;
}

function saveEssays(essays: EssayItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(essays));
}

export function EssayCard() {
  const [essays, setEssays] = useState<EssayItem[]>(defaultEssays);
  const [current, setCurrent] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItems, setEditItems] = useState<EssayItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Load from localStorage on mount, then sync from API
  useEffect(() => {
    // 1. 先从 localStorage 快速加载
    const stored = getStoredEssays();
    setEssays(stored);

    // 2. 后台从 API 拉取最新
    settingsApi.get().then((data) => {
      if (data?.essays && Array.isArray(data.essays) && data.essays.length > 0) {
        const mapped: EssayItem[] = data.essays.map((e) => ({
          text: e.content || "",
          date: e.date || "",
          source: "随想",
        }));
        setEssays(mapped);
        saveEssays(mapped);
      }
    }).catch((err) => {
      console.warn("Failed to fetch essays from API, using cache:", err);
    });
  }, []);

  // Carousel
  useEffect(() => {
    if (essays.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % essays.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [essays.length]);

  // Open dialog
  const handleOpenEdit = useCallback(() => {
    setEditItems(essays.map((e) => ({ ...e })));
    setDialogOpen(true);
  }, [essays]);

  // Edit handlers
  const updateItem = (index: number, field: keyof EssayItem, value: string) => {
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const deleteItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditItems((prev) => [...prev, { text: "", date: today, source: "随想" }]);
  };

  const handleSave = () => {
    const validItems = editItems.filter((item) => item.text.trim() !== "");
    if (validItems.length === 0) return;
    setEssays(validItems);
    saveEssays(validItems);
    setCurrent(0);
    setDialogOpen(false);

    // 同步到 API
    try {
      settingsApi.update({
        essays: validItems.map((item, index) => ({
          id: `essay-${index}`,
          content: item.text,
          date: item.date,
        })),
      }).catch((err) => {
        console.warn("Failed to save essays to API:", err);
      });
    } catch (err) {
      console.warn("Failed to save essays to API:", err);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine relative group overflow-hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-teal-500/5 pointer-events-none" />
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-5 -left-10 w-24 h-24 bg-teal-500/8 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Quote className="size-8 text-emerald-400/30 absolute -top-1 -left-1" />
          <Quote className="size-4 text-primary relative" />
          <span className="text-sm font-medium">随笔</span>
        </div>

        {/* Edit button - visible on hover */}
        <button
          onClick={handleOpenEdit}
          className={`flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-2.5 py-1 transition-all cursor-pointer ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          aria-label="编辑随想"
        >
          <Pencil className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="relative min-h-[60px]">
        <AnimatePresence mode="wait">
          {essays.length > 0 && (
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm leading-relaxed text-foreground/90">
                {essays[current]?.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>{essays[current]?.date}</span>
        <span>来自{essays[current]?.source}</span>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {essays.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑随想</DialogTitle>
            <DialogDescription>
              管理你的随想内容，编辑后点击保存。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editItems.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    #{index + 1}
                  </Label>
                  <button
                    onClick={() => deleteItem(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded cursor-pointer"
                    aria-label="删除"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <Textarea
                  value={item.text}
                  onChange={(e) => updateItem(index, "text", e.target.value)}
                  placeholder="写下你的随想..."
                  className="resize-none text-sm min-h-[60px]"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={item.source}
                      onChange={(e) =>
                        updateItem(index, "source", e.target.value)
                      }
                      placeholder="来源"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={item.date}
                      onChange={(e) =>
                        updateItem(index, "date", e.target.value)
                      }
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={addItem}
            >
              <Plus className="size-4 mr-1" />
              添加新随想
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
