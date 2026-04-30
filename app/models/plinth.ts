import type { StrapiListMeta } from './pagination';

export interface Plinth {
  id: number;
  documentId: string;
  name: string;
  code?: string | null;
  price: number | string | null;
  color: string | null;
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PlinthsResponse {
  data: Plinth[];
  meta: StrapiListMeta;
}
