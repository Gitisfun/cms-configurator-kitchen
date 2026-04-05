import type { StrapiListMeta } from './pagination';

export interface PriceClass {
  id: number;
  documentId: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PriceClassesResponse {
  data: PriceClass[];
  meta: StrapiListMeta;
}

export interface PriceClassDocumentResponse {
  data: PriceClass;
}
