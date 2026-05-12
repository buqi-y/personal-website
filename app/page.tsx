"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  ProfileCard,
  MusicPlayer,
  DateTimeCard,
  EssayCard,
  LatestWorksCard,
  LatestNotesCard,
  LifeCard,
  BookmarksCard,
  TechStackCard,
} from "@/components/home";
import { CardEditorWrapper, EditorToolbar } from "@/components/shared";
import { useEditor } from "@/lib/contexts/editor-context";
import { motion } from "framer-motion";

// Map card id to its component
const cardComponentMap: Record<string, React.ReactNode> = {
  datetime: <DateTimeCard />,
  essay: <EssayCard />,
  "latest-works": <LatestWorksCard />,
  "latest-notes": <LatestNotesCard />,
  life: <LifeCard />,
  bookmarks: <BookmarksCard />,
  "tech-stack": <TechStackCard />,
};

function DynamicCardContent({ type }: { type: string }) {
  const labels: Record<string, string> = {
    text: "文本卡片",
    image: "图片卡片",
    link: "链接卡片",
    stats: "统计卡片",
  };
  return (
    <div className="glass rounded-3xl p-6 h-full min-h-[120px] flex items-center justify-center">
      <span className="text-sm text-muted-foreground">
        {labels[type] || "自定义卡片"}
      </span>
    </div>
  );
}

export default function Home() {
  const { isEditing, cards, reorderCards } = useEditor();

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const canDragRef = useRef(false);

  const handleDragHandleMouseDown = useCallback(() => {
    canDragRef.current = true;
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!canDragRef.current) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    canDragRef.current = false;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      reorderCards(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
    canDragRef.current = false;
  }, [draggedIndex, reorderCards]);

  // Filter visible cards for the grid
  const visibleCards = cards.filter((c) => c.visible);

  return (
    <>
      {/* Editor toolbar — only shows in editing mode */}
      {isEditing && <EditorToolbar />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8"
      >
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar */}
          <aside className="w-full xl:w-[320px] xl:sticky xl:top-20 xl:self-start flex flex-col gap-6 shrink-0">
            <CardEditorWrapper cardId="profile">
              <ProfileCard />
            </CardEditorWrapper>
            <CardEditorWrapper cardId="music">
              <MusicPlayer />
            </CardEditorWrapper>
          </aside>

          {/* Right Content Grid */}
          <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
            {visibleCards.map((card, index) => (
              <CardEditorWrapper
                key={card.id}
                cardId={card.id}
                cardIndex={index}
                isDragging={draggedIndex === index}
                isDropTarget={dropTargetIndex === index && draggedIndex !== index}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onDragHandleMouseDown={handleDragHandleMouseDown}
              >
                {cardComponentMap[card.id] || <DynamicCardContent type={card.type} />}
              </CardEditorWrapper>
            ))}

            {/* Add card placeholder in edit mode */}
            {isEditing && (
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-3xl p-6 min-h-[120px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  使用工具栏的「添加卡片」按钮添加新卡片
                </span>
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </>
  );
}
