"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import Link from "next/link";

export function LifeCard() {
  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-orange-500/5 pointer-events-none" />
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-5 -left-10 w-24 h-24 bg-orange-500/8 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">生活</h3>
        <Link
          href="/life"
          className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted rounded-full px-2.5 py-1 transition-all"
        >
          查看全部
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Photo Placeholder */}
      <div className="rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 h-24 flex items-center justify-center mb-3 border border-white/5">
        <Camera className="size-6 text-amber-400/60" />
      </div>

      {/* Text */}
      <p className="text-sm text-muted-foreground">
        周末去了趟咖啡馆，阳光正好，适合发呆。
      </p>
      <p className="text-xs text-muted-foreground/60 mt-2">2024-01-14</p>
      </div>
    </motion.div>
  );
}
