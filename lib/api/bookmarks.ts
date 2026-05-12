import { apiGet, apiPut } from './client';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  category?: string;
}

export const bookmarksApi = {
  get: () => apiGet<Bookmark[]>('/api/bookmarks'),
  update: (data: Bookmark[]) => apiPut('/api/bookmarks', data),
};
