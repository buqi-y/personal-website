import { apiPost, apiDelete } from './client';

export const mediaApi = {
  upload: async (file: File, folder: 'wallpapers' | 'avatars' = 'wallpapers'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const result = await apiPost<{ url: string }>('/api/media/upload', formData);
    return result.url;
  },
  remove: (key: string) => apiDelete(`/api/media/${encodeURIComponent(key)}`),
};
