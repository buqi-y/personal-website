import { apiGet, apiPut } from './client';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  image?: string;
  tags?: string[];
  date?: string;
}

export const portfolioApi = {
  get: () => apiGet<PortfolioItem[]>('/api/portfolio'),
  update: (data: PortfolioItem[]) => apiPut('/api/portfolio', data),
};
