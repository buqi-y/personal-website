"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagManagerProps {
  tags: string[];
  activeTag: string;
  onTagSelect: (tag: string) => void;
  onTagAdd: (tag: string) => void;
  onTagDelete: (tag: string) => void;
  undeletableTags?: string[];
}

export function TagManager({
  tags,
  activeTag,
  onTagSelect,
  onTagAdd,
  onTagDelete,
  undeletableTags = [],
}: TagManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagAdd(trimmed);
      setNewTag("");
      setDialogOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {tags.map((tag) => (
          <motion.button
            key={tag}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => onTagSelect(tag)}
            className={cn(
              "group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
              activeTag === tag
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tag}
            {!undeletableTags.includes(tag) && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTagDelete(tag);
                }}
                className="ml-0.5 hidden rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive group-hover:inline-flex"
              >
                <X className="size-3" />
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Plus className="size-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入标签名称"
              className="flex-1"
            />
            <Button onClick={handleAdd} size="sm">
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
