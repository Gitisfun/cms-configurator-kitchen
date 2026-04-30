import type { StrapiListMeta } from './pagination';

export interface Back {
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

export interface BacksResponse {
  data: Back[];
  meta: StrapiListMeta;
}

export interface BackDocumentResponse {
  data: Back;
}
