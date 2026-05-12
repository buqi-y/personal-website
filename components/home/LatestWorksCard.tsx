"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Folder } from "lucide-react";
import Link from "next/link";

const projects = [
  { id: 1, name: "个人网站", color: "bg-blue-500/20", textColor: "text-blue-400", shadowColor: "hover:shadow-blue-500/20" },
  { id: 2, name: "Todo App", color: "bg-green-500/20", textColor: "text-green-400", shadowColor: "hover:shadow-green-500/20" },
  { id: 3, name: "Design System", color: "bg-purple-500/20", textColor: "text-purple-400", shadowColor: "hover:shadow-purple-500/20" },
];

export function LatestWorksCard() {
  return (
    <motion.div
      className="rounded-3xl glass p-6 col-span-1 md:col-span-2 card-shine"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">最新作品</h3>
        <Link
          href="/portfolio"
          className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-2.5 py-1 transition-all"
        >
          查看全部
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            className={`rounded-xl ${project.color} p-4 flex flex-col items-center justify-center min-h-[100px] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group cursor-pointer hover:shadow-lg ${project.shadowColor}`}
            whileHover={{ y: -4, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* White highlight overlay on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
            <Folder className={`size-6 ${project.textColor} mb-2 relative`} />
            <span className="text-xs font-medium relative">{project.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
