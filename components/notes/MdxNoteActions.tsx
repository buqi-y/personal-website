"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteEditor, type NoteData } from "./NoteEditor";

interface MdxNoteActionsProps {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  readingTime: string;
  onSaved?: () => void;
}

export function MdxNoteActions({
  slug,
  title,
  date,
  category,
  tags,
  summary,
  content,
  readingTime,
  onSaved,
}: MdxNoteActionsProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSave = (note: NoteData) => {
    try {
      const stored = localStorage.getItem("notes-items");
      const notes: Array<Record<string, unknown>> = stored ? JSON.parse(stored) : [];

      // Save with the original slug so it overrides the MDX note display
      const noteItem = {
        slug,
        title: note.title,
        date: note.date,
        category: note.category,
        tags: note.tags,
        summary: note.summary,
        content: note.content,
        readingTime: note.readingTime,
        isLocal: true,
        source: "local" as const,
      };

      const existingIndex = notes.findIndex((n) => n.slug === slug);
      if (existingIndex >= 0) {
        notes[existingIndex] = noteItem;
      } else {
        notes.unshift(noteItem);
      }

      localStorage.setItem("notes-items", JSON.stringify(notes));
      onSaved?.();
    } catch (e) {
      console.warn("Error saving note:", e);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setEditorOpen(true)}
      >
        <Pencil className="size-3.5" />
        编辑
      </Button>

      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={{
          id: slug,
          title,
          date,
          category,
          tags,
          summary,
          content,
          source: "local",
        }}
        onSave={handleSave}
        mode="edit"
      />
    </>
  );
}
