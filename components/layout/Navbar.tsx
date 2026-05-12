"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/contexts/theme-context";
import { useEditor } from "@/lib/contexts/editor-context";
import {
  Sparkles,
  Sun,
  Moon,
  Settings,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";
import { MobileNav } from "./MobileNav";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/portfolio", label: "作品集" },
  { href: "/notes", label: "笔记" },
  { href: "/life", label: "生活" },
  { href: "/bookmarks", label: "收藏" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isEditing, toggleEditing } = useEditor();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* 左侧：Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="size-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-medium text-foreground">
              张三
            </span>
          </Link>

          {/* 中间：桌面导航链接 */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 右侧：按钮组 */}
          <div className="flex items-center gap-1">
            {/* 主题切换 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="切换主题"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {/* 设置 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="设置"
            >
              <Settings className="size-4" />
            </Button>

            {/* 编辑布局 */}
            <Button
              variant="ghost"
              size="icon"
              className={`${isEditing ? "text-primary bg-primary/10" : "text-muted-foreground"} hover:text-foreground`}
              aria-label="编辑布局"
              onClick={toggleEditing}
              type="button"
            >
              <LayoutGrid className="size-4" />
            </Button>

            {/* 移动端汉堡菜单 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileNavOpen(true)}
              aria-label="菜单"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 设置面板 */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* 移动端导航 */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  );
}
