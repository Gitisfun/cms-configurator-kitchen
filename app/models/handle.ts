import type { StrapiListMeta } from './pagination';
import type { HandlePosition } from './handle-position';

/** Strapi may return a populated entity list or a `{ data }` relation wrapper. */
export type HandleHandlePositionsField =
  | HandlePosition[]
  | { data: HandlePosition[] }
  | null
  | undefined;

export interface Handle {
  id: number;
  documentId: string;
  name: string;
  price: number | string | null;
  color: string | null;
  hasHold: boolean;
  position: number;
  image?: unknown;
  code?: string | null;
  /** Matches extractor typo stored from catalog PDFs. */
  handlePostions?: string | null;
  height?: string | null;
  surchargeDisplay?: string | null;
  catalogType?: string | null;
  catalogSubtype?: string | null;
  description?: string | null;
  handlePositions?: HandleHandlePositionsField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface HandlesResponse {
  data: Handle[];
  meta: StrapiListMeta;
}

export interface HandleDocumentResponse {
  data: Handle;
}
