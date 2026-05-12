import { getAllNotes, getAllCategories } from "@/lib/mdx";
import { NotesClient } from "@/components/notes/NotesClient";

export const metadata = {
  title: "笔记 - Personal Website",
  description: "记录学习与思考",
};

export default function NotesPage() {
  const notes = getAllNotes();
  const categories = getAllCategories();

  return <NotesClient notes={notes} categories={categories} />;
}
