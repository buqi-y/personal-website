"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/contexts/theme-context";
import { Sun, Moon, Home, Briefcase, FileText, Heart, Bookmark } from "lucide-react";

const navLinks = [
  { href: "/", label: "首页", icon: Home },
  { href: "/portfolio", label: "作品集", icon: Briefcase },
  { href: "/notes", label: "笔记", icon: FileText },
  { href: "/life", label: "生活", icon: Heart },
  { href: "/bookmarks", label: "收藏", icon: Bookmark },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] bg-zinc-900/95 border-zinc-800 p-0">
        <SheetHeader className="p-4 border-b border-zinc-800">
          <SheetTitle className="text-foreground text-left">导航</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            {theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
