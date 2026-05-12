"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Globe, Video, BookOpen } from "lucide-react";
import Link from "next/link";

const bookmarks = [
  { id: 1, name: "MDN Web Docs", icon: Globe, color: "text-blue-400", bgColor: "bg-blue-500/15" },
  { id: 2, name: "YouTube 教程", icon: Video, color: "text-red-400", bgColor: "bg-red-500/15" },
  { id: 3, name: "设计灵感", icon: BookOpen, color: "text-purple-400", bgColor: "bg-purple-500/15" },
  { id: 4, name: "开发工具", icon: Bookmark, color: "text-green-400", bgColor: "bg-green-500/15" },
];

export function BookmarksCard() {
  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">收藏</h3>
        <Link
          href="/bookmarks"
          className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-2.5 py-1 transition-all"
        >
          查看全部
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-1.5">
        {bookmarks.map((item) => {
          const IconComp = item.icon;
          return (
            <motion.div
              key={item.id}
              className="flex items-center gap-3 cursor-pointer group rounded-lg p-2 hover:bg-white/5 transition-all"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bgColor} border border-white/5`}>
                <IconComp className={`size-4 ${item.color}`} />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                {item.name}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
