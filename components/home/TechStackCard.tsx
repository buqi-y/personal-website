"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const techs = [
  { name: "React", category: "frontend" },
  { name: "Next.js", category: "frontend" },
  { name: "TypeScript", category: "frontend" },
  { name: "Tailwind CSS", category: "frontend" },
  { name: "Node.js", category: "backend" },
  { name: "Python", category: "backend" },
  { name: "PostgreSQL", category: "backend" },
  { name: "Docker", category: "tool" },
  { name: "Figma", category: "tool" },
];

const categoryStyles: Record<string, string> = {
  frontend: "border-blue-400/30 bg-blue-500/10 hover:border-blue-400/50 hover:bg-blue-500/15",
  backend: "border-green-400/30 bg-green-500/10 hover:border-green-400/50 hover:bg-green-500/15",
  tool: "border-purple-400/30 bg-purple-500/10 hover:border-purple-400/50 hover:bg-purple-500/15",
};

export function TechStackCard() {
  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium">技术栈</h3>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {techs.map((tech) => (
          <motion.div
            key={tech.name}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Badge
              variant="secondary"
              className={`text-xs cursor-default border transition-colors ${categoryStyles[tech.category]}`}
            >
              {tech.name}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
