import { apiGet, apiPut, apiPost } from './client';

export interface LifePost {
  id: string;
  content: string;
  date: string;
  images: string[];
  videos: string[];
}

export const lifeApi = {
  list: () => apiGet<LifePost[]>('/api/life'),
  update: (data: LifePost[]) => apiPut('/api/life', data),
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiPost<{ url: string }>('/api/life/upload', formData);
    return result.url;
  },
};
