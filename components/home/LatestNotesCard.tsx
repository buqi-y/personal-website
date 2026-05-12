"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

const notes = [
  { id: 1, title: "React Server Components 深入理解", date: "2024-01-15" },
  { id: 2, title: "Tailwind CSS v4 新特性一览", date: "2024-01-12" },
  { id: 3, title: "TypeScript 5.3 类型体操技巧", date: "2024-01-10" },
];

export function LatestNotesCard() {
  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">最新笔记</h3>
        <Link
          href="/notes"
          className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-2.5 py-1 transition-all"
        >
          查看全部
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            className="relative flex items-start gap-3 group cursor-pointer rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-3 transition-all overflow-hidden"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
          >
            {/* Hover left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-purple-400 rounded-l opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileText className="size-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate group-hover:text-foreground transition-colors">
                {note.title}
              </p>
              <p className="text-xs text-muted-foreground">{note.date}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
