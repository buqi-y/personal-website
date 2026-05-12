"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MdxNoteActions } from "./MdxNoteActions";
import LocalNoteDetail from "./LocalNoteDetail";

interface MdxMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  readingTime: string;
}

interface NoteDetailClientProps {
  slug: string;
  mdxMeta: MdxMeta;
  mdxContent: string;
  children: ReactNode;
}

const categoryColors: Record<string, string> = {
  技术: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  设计: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  思考: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  随笔: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export function NoteDetailClient({
  slug,
  mdxMeta,
  mdxContent,
  children,
}: NoteDetailClientProps) {
  const [showLocal, setShowLocal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notes-items");
      if (stored) {
        const notes: Array<{ slug: string }> = JSON.parse(stored);
        setShowLocal(notes.some((n) => n.slug === slug));
      }
    } catch (e) {
      console.warn("Error checking localStorage:", e);
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  // If a local edited version exists, show it via LocalNoteDetail
  if (showLocal) {
    return <LocalNoteDetail slug={slug} />;
  }

  // Otherwise, show the server-rendered MDX content with edit button
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back button */}
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        返回笔记列表
      </Link>

      {/* Article header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            {mdxMeta.title}
          </h1>
          <MdxNoteActions
            slug={mdxMeta.slug}
            title={mdxMeta.title}
            date={mdxMeta.date}
            category={mdxMeta.category}
            tags={mdxMeta.tags}
            summary={mdxMeta.summary}
            content={mdxContent}
            readingTime={mdxMeta.readingTime}
            onSaved={() => setShowLocal(true)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {new Date(mdxMeta.date).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {mdxMeta.readingTime}
          </span>
          <Badge
            className={`text-[11px] px-2 py-0.5 border ${
              categoryColors[mdxMeta.category] ??
              "bg-muted text-muted-foreground border-border"
            }`}
          >
            {mdxMeta.category}
          </Badge>
        </div>

        {/* Tags */}
        {mdxMeta.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Tag className="size-3.5 text-muted-foreground" />
            {mdxMeta.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[11px] text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* MDX Content (server-rendered, passed as children) */}
      <article className="glass rounded-xl p-6 sm:p-8">
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-li:text-foreground/85">
          {children}
        </div>
      </article>
    </div>
  );
}
