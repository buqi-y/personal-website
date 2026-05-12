import { apiGet, apiPut } from './client';

export interface SiteSettings {
  backgroundColor?: string;
  backgroundGradient?: string;
  glassOpacity?: number;
  wallpaperUrl?: string;
}

export interface CardLayout {
  order: string[];
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
}

export interface EssayItem {
  id: string;
  content: string;
  date: string;
}

export interface ProfileData {
  name: string;
  bio: string;
  avatar?: string;
  links: { platform: string; url: string }[];
}

export interface AllSettings {
  siteSettings?: SiteSettings;
  cardLayout?: CardLayout;
  theme?: ThemeConfig;
  essays?: EssayItem[];
  profile?: ProfileData;
}

export const settingsApi = {
  get: () => apiGet<AllSettings>('/api/settings'),
  update: (data: Partial<AllSettings>) => apiPut('/api/settings', data),
};
