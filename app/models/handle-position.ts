import type { StrapiListMeta } from './pagination';

export interface HandlePosition {
  id: number;
  documentId: string;
  name: string;
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface HandlePositionsResponse {
  data: HandlePosition[];
  meta: StrapiListMeta;
}

export interface HandlePositionDocumentResponse {
  data: HandlePosition;
}
