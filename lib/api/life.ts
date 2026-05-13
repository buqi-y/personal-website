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
    const result = await apiPost<{ url: string; proxyUrl: string }>('/api/life/upload', formData);
    // 优先使用代理 URL（解决 CORS 和 COS 2024 下载限制）
    // proxyUrl 是相对路径（如 /api/life/image/images/xxx.jpg），需要加上 API 基础地址
    if (result.proxyUrl) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      return `${apiBase}${result.proxyUrl}`;
    }
    return result.url;
  },
  /** 将 COS 公开 URL 转为代理 URL */
  getProxyUrl: (src: string): string => {
    // 匹配 COS URL 中的 images/ 路径
    const match = src.match(/personal-site-life[^/]*\.cos\.[^/]+\/(.+)/);
    if (match) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      return `${apiBase}/api/life/image/${match[1]}`;
    }
    return src;
  },
};
