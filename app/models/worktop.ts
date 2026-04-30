import type { StrapiListMeta } from './pagination';

export interface Worktop {
  id: number;
  documentId: string;
  name: string;
  code: string | null;
  note: string | null;
  description: string | null;
  price: number | string | null;
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface WorktopsResponse {
  data: Worktop[];
  meta: StrapiListMeta;
}

export interface WorktopDocumentResponse {
  data: Worktop;
}
