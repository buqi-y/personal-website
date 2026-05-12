import { apiGet, apiPut } from './client';

export interface MusicConfig {
  playlistId: string;
  playMode: 'loop' | 'single' | 'random';
  volume: number;
}

export const musicApi = {
  get: () => apiGet<MusicConfig>('/api/music'),
  update: (data: MusicConfig) => apiPut('/api/music', data),
};
