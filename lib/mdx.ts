import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const notesDirectory = path.join(process.cwd(), "content/notes");

export interface NoteMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  readingTime: string;
}

export function getAllNotes(): NoteMeta[] {
  const files = fs
    .readdirSync(notesDirectory)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const notes = files.map((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const filePath = path.join(notesDirectory, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const stats = readingTime(content);

    return {
      slug,
      title: data.title ?? "",
      date: data.date ?? "",
      category: data.category ?? "",
      tags: data.tags ?? [],
      summary: data.summary ?? "",
      readingTime: stats.text,
    } satisfies NoteMeta;
  });

  return notes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getNoteBySlug(slug: string): {
  meta: NoteMeta;
  content: string;
} {
  const mdxPath = path.join(notesDirectory, `${slug}.mdx`);
  const mdPath = path.join(notesDirectory, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  const meta: NoteMeta = {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    category: data.category ?? "",
    tags: data.tags ?? [],
    summary: data.summary ?? "",
    readingTime: stats.text,
  };

  return { meta, content };
}

export function getAllCategories(): string[] {
  const notes = getAllNotes();
  const categories = new Set(notes.map((n) => n.category).filter(Boolean));
  return Array.from(categories);
}

export function getAllTags(): string[] {
  const notes = getAllNotes();
  const tags = new Set(notes.flatMap((n) => n.tags));
  return Array.from(tags);
}
