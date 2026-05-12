"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { settingsApi } from "@/lib/api";

export type CardSize = "1x1" | "1x2" | "2x1" | "2x2";
export type CardType = "text" | "image" | "link" | "stats" | "datetime" | "essay" | "latest-works" | "latest-notes" | "life" | "bookmarks" | "tech-stack" | "profile" | "music" | "custom";

export interface CardItem {
  id: string;
  type: CardType | string;
  size: CardSize;
  visible: boolean;
}

interface EditorContextType {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  toggleEditing: () => void;
  cards: CardItem[];
  removeCard: (id: string) => void;
  resizeCard: (id: string, size: CardSize) => void;
  addCard: (type: string) => void;
  reorderCards: (fromIndex: number, toIndex: number) => void;
  saveLayout: () => void;
  cancelEditing: () => void;
}

const STORAGE_KEY = "personal-site-card-layout";

const defaultCards: CardItem[] = [
  { id: "datetime", type: "datetime", size: "1x1", visible: true },
  { id: "essay", type: "essay", size: "1x1", visible: true },
  { id: "latest-works", type: "latest-works", size: "2x1", visible: true },
  { id: "latest-notes", type: "latest-notes", size: "1x1", visible: true },
  { id: "life", type: "life", size: "1x1", visible: true },
  { id: "bookmarks", type: "bookmarks", size: "1x1", visible: true },
  { id: "tech-stack", type: "tech-stack", size: "1x1", visible: true },
];

function loadCardsFromStorage(): CardItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CardItem[];
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function saveCardsToStorage(cards: CardItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore storage errors
  }
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cards, setCards] = useState<CardItem[]>(defaultCards);
  const snapshotRef = useRef<CardItem[]>(defaultCards);

  // Load from localStorage on mount, then sync from API
  useEffect(() => {
    // 1. 先从 localStorage 快速加载
    const stored = loadCardsFromStorage();
    if (stored) {
      setCards(stored);
    }

    // 2. 后台从 API 拉取最新
    settingsApi.get().then((data) => {
      if (data?.cardLayout?.order) {
        // 根据 API 返回的 order 重建 cards
        const orderIds = data.cardLayout.order;
        const currentCards = stored || defaultCards;
        const reordered = orderIds
          .map((id: string) => currentCards.find((c) => c.id === id))
          .filter((c): c is CardItem => c !== undefined);
        // 添加 order 中没有的 card
        const remaining = currentCards.filter((c) => !orderIds.includes(c.id));
        const merged = [...reordered, ...remaining];
        setCards(merged);
        saveCardsToStorage(merged);
      }
    }).catch((err) => {
      console.warn("Failed to fetch card layout from API, using cache:", err);
    });
  }, []);

  // Snapshot cards when entering edit mode
  const handleSetIsEditing = useCallback((v: boolean) => {
    if (v && !isEditing) {
      snapshotRef.current = cards;
    }
    setIsEditing(v);
  }, [isEditing, cards]);

  const toggleEditing = useCallback(() => {
    handleSetIsEditing(!isEditing);
  }, [handleSetIsEditing, isEditing]);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const resizeCard = useCallback((id: string, size: CardSize) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, size } : c))
    );
  }, []);

  const addCard = useCallback((type: string) => {
    const id = `${type}-${Date.now()}`;
    setCards((prev) => [...prev, { id, type, size: "1x1", visible: true }]);
  }, []);

  const reorderCards = useCallback((fromIndex: number, toIndex: number) => {
    setCards((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const saveLayout = useCallback(() => {
    saveCardsToStorage(cards);
    setIsEditing(false);
    // 同步到 API
    try {
      settingsApi.update({ cardLayout: { order: cards.map((c) => c.id) } }).catch((err) => {
        console.warn("Failed to save card layout to API:", err);
      });
    } catch (err) {
      console.warn("Failed to save card layout to API:", err);
    }
  }, [cards]);

  const cancelEditing = useCallback(() => {
    setCards(snapshotRef.current);
    setIsEditing(false);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        isEditing,
        setIsEditing: handleSetIsEditing,
        toggleEditing,
        cards,
        removeCard,
        resizeCard,
        addCard,
        reorderCards,
        saveLayout,
        cancelEditing,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
