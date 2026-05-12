"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { GripHorizontal } from "lucide-react";

interface DraggablePanelProps {
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  className?: string;
  handleClassName?: string;
  showHandle?: boolean;
  title?: string;
  onClose?: () => void;
}

export function DraggablePanel({
  children,
  defaultPosition,
  className = "",
  handleClassName = "",
  showHandle = true,
  title,
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(defaultPosition ?? { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  // Calculate default position after mount to account for viewport
  useEffect(() => {
    if (!defaultPosition && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPosition({
        x: Math.round((window.innerWidth - rect.width) / 2),
        y: 80,
      });
    }
    setMounted(true);
  }, [defaultPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      // Clamp to viewport
      const clampedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 50, newY));
      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className={`fixed z-[9999] select-none ${className}`}
      style={{
        left: position.x,
        top: position.y,
        opacity: mounted ? 1 : 0,
        transition: isDragging ? "none" : "opacity 0.2s ease",
      }}
    >
      {showHandle && (
        <div
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 cursor-grab active:cursor-grabbing rounded-t-xl bg-muted/80 border-b border-border/50 ${handleClassName}`}
          onMouseDown={handleMouseDown}
        >
          <GripHorizontal className="size-3.5 text-muted-foreground" />
          {title && (
            <span className="text-[11px] text-muted-foreground font-medium select-none">
              {title}
            </span>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
