import { apiGet, apiPut, apiDelete } from './client';

export interface Note {
  slug: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
  description?: string;
}

export interface NoteListItem {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  description?: string;
}

export const notesApi = {
  list: () => apiGet<NoteListItem[]>('/api/notes'),
  get: (slug: string) => apiGet<Note>(`/api/notes/${slug}`),
  save: (slug: string, data: Note) => apiPut(`/api/notes/${slug}`, data),
  remove: (slug: string) => apiDelete(`/api/notes/${slug}`),
};
