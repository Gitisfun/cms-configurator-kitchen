import type { StrapiListMeta } from './pagination';

export interface Category {
  id: number;
  documentId: string;
  name: string;
  /** Configurator / API key (e.g. base, wall, tall). */
  value?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CategoriesResponse {
  data: Category[];
  meta: StrapiListMeta;
}
