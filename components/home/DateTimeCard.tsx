"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud } from "lucide-react";

export function DateTimeCard() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [weekday, setWeekday] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDate(
        new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(now)
      );
      setWeekday(
        new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(now)
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-3xl glass p-6 card-shine relative overflow-hidden">
        <div className="h-20 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-3xl glass p-6 card-shine relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 pointer-events-none" />
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-5 -left-10 w-24 h-24 bg-purple-500/8 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {time}
        </div>
        <div className="text-sm text-muted-foreground">{date}</div>
        <div className="text-sm text-muted-foreground">{weekday}</div>
        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Cloud className="size-5 text-blue-400" />
          </motion.div>
          <span>22°C</span>
        </div>
      </div>
    </motion.div>
  );
}
