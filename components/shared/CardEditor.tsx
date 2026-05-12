"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, GripVertical, Plus, Type, ImageIcon, Link2, BarChart3, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor, type CardSize } from "@/lib/contexts/editor-context";
import { DraggablePanel } from "./DraggablePanel";

/* ================================================================
   Size label map
   ================================================================ */
const sizeLabels: Record<CardSize, string> = {
  "1x1": "小 1×1",
  "1x2": "中 1×2",
  "2x1": "大 2×1",
  "2x2": "特大 2×2",
};

const sizeGridClass: Record<CardSize, string> = {
  "1x1": "",
  "1x2": "md:row-span-2",
  "2x1": "md:col-span-2",
  "2x2": "md:col-span-2 md:row-span-2",
};

/* ================================================================
   CardEditorWrapper — wraps each card, shows edit controls
   ================================================================ */
interface CardEditorWrapperProps {
  cardId: string;
  children: React.ReactNode;
  className?: string;
  // Drag-and-drop props
  cardIndex?: number;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragHandleMouseDown?: () => void;
}

export function CardEditorWrapper({
  cardId,
  children,
  className = "",
  cardIndex,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDragHandleMouseDown,
}: CardEditorWrapperProps) {
  const { isEditing, cards, removeCard, resizeCard } = useEditor();
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [removing, setRemoving] = useState(false);

  const card = cards.find((c) => c.id === cardId);

  // If card was removed, don't render
  if (card && !card.visible) return null;

  // Non-editing mode: just render children with size class
  if (!isEditing) {
    const sizeClass = card ? sizeGridClass[card.size] : "";
    return <div className={`${className} ${sizeClass}`}>{children}</div>;
  }

  const currentSize = card?.size ?? "1x1";
  const sizeClass = sizeGridClass[currentSize];
  const hasDragSupport = cardIndex !== undefined;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => {
      removeCard(cardId);
    }, 300);
  };

  return (
    <div
      className={`${className} ${sizeClass} ${isDragging ? "opacity-50 scale-95 transition-all duration-200" : ""} ${isDropTarget ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background rounded-3xl transition-all duration-200" : ""}`}
      draggable={hasDragSupport}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onDragLeave={(e) => {
        e.preventDefault();
      }}
    >
    <motion.div
      className="relative group"
      animate={{ opacity: removing ? 0 : 1, scale: removing ? 0.95 : 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dashed border in edit mode */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-3xl pointer-events-none z-10" />

      {/* Action buttons — always visible in edit mode */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        {/* Resize */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground shadow-sm"
          onClick={() => setShowSizePanel(!showSizePanel)}
          type="button"
        >
          <Maximize2 className="size-3" />
        </Button>

        {/* Drag handle */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shadow-sm"
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragHandleMouseDown?.();
          }}
          onMouseUp={() => {
            // Reset if not dragged
          }}
        >
          <GripVertical className="size-3" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="bg-background/80 backdrop-blur text-muted-foreground hover:text-destructive shadow-sm"
          onClick={handleRemove}
          type="button"
        >
          <X className="size-3" />
        </Button>
      </div>

      {/* Size options — draggable floating panel */}
      {showSizePanel && (
        <DraggablePanel
          title="调整尺寸"
          defaultPosition={{ x: 100, y: 100 }}
          className="rounded-xl shadow-2xl"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-b-xl p-2 min-w-[140px]">
            {(Object.entries(sizeLabels) as [CardSize, string][]).map(([size, label]) => (
              <button
                key={size}
                className={`block w-full px-3 py-1.5 text-xs text-left rounded-lg transition-colors ${
                  currentSize === size
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  resizeCard(cardId, size);
                  setShowSizePanel(false);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
            <div className="mt-1 pt-1 border-t border-border">
              <button
                className="block w-full px-3 py-1.5 text-xs text-left rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setShowSizePanel(false)}
                type="button"
              >
                关闭
              </button>
            </div>
          </div>
        </DraggablePanel>
      )}

      {children}
    </motion.div>
    </div>
  );
}

/* ================================================================
   EditorToolbar — floating draggable toolbar
   ================================================================ */
export function EditorToolbar() {
  const { isEditing, saveLayout, cancelEditing, addCard } = useEditor();
  const [showAddPanel, setShowAddPanel] = useState(false);

  if (!isEditing) return null;

  const cardTypes = [
    { type: "text", label: "文本", icon: Type },
    { type: "image", label: "图片", icon: ImageIcon },
    { type: "link", label: "链接", icon: Link2 },
    { type: "stats", label: "统计", icon: BarChart3 },
  ];

  return (
    <>
      {/* Main Toolbar — draggable */}
      <DraggablePanel
        title="编辑工具栏"
        className="rounded-xl shadow-2xl"
      >
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border border-t-0 rounded-b-xl px-4 py-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPanel(!showAddPanel)}
            type="button"
          >
            <Plus className="size-3.5 mr-1" />
            添加卡片
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            size="sm"
            onClick={saveLayout}
            type="button"
          >
            <Save className="size-3.5 mr-1" />
            保存布局
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            type="button"
          >
            <RotateCcw className="size-3.5 mr-1" />
            取消
          </Button>
        </div>
      </DraggablePanel>

      {/* Add Card Panel — draggable */}
      <AnimatePresence>
        {showAddPanel && (
          <DraggablePanel
            title="添加卡片"
            defaultPosition={{ x: Math.round(window.innerWidth / 2 - 100), y: 160 }}
            className="rounded-xl shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/95 backdrop-blur-xl border border-border border-t-0 rounded-b-xl p-3 min-w-[180px]"
            >
              <p className="text-[11px] text-muted-foreground mb-2 font-medium">选择卡片类型</p>
              <div className="grid grid-cols-2 gap-1.5">
                {cardTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                    onClick={() => {
                      addCard(type);
                      setShowAddPanel(false);
                    }}
                    type="button"
                  >
                    <Icon className="size-4" />
                    <span className="text-[11px]">{label}</span>
                  </button>
                ))}
              </div>
              <button
                className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1 rounded hover:bg-muted transition-colors"
                onClick={() => setShowAddPanel(false)}
                type="button"
              >
                关闭
              </button>
            </motion.div>
          </DraggablePanel>
        )}
      </AnimatePresence>
    </>
  );
}
