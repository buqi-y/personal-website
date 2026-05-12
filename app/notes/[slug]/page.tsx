import { MDXRemote } from "next-mdx-remote/rsc";
import { getNoteBySlug, getAllNotes } from "@/lib/mdx";
import LocalNoteDetail from "@/components/notes/LocalNoteDetail";
import { NoteDetailClient } from "@/components/notes/NoteDetailClient";

// Allow dynamic slugs not pre-generated at build time
export const dynamicParams = true;

export function generateStaticParams() {
  const notes = getAllNotes();
  return notes.map((note) => ({ slug: note.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return params.then(({ slug }) => {
    try {
      const { meta } = getNoteBySlug(slug);
      return {
        title: `${meta.title} - 笔记`,
        description: meta.summary,
      };
    } catch {
      return { title: "笔记" };
    }
  });
}

function isMdxNote(slug: string): boolean {
  try {
    getNoteBySlug(slug);
    return true;
  } catch {
    return false;
  }
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Non-MDX slug: pure local note from localStorage
  if (!isMdxNote(slug)) {
    return <LocalNoteDetail slug={slug} />;
  }

  // MDX note: wrap in client component that checks for local edits
  const { meta, content } = getNoteBySlug(slug);

  return (
    <NoteDetailClient slug={slug} mdxMeta={meta} mdxContent={content}>
      <MDXRemote source={content} />
    </NoteDetailClient>
  );
}
