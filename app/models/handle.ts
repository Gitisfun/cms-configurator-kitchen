import type { StrapiListMeta } from './pagination';
import type { HandlePosition } from './handle-position';

/** Strapi may return a populated entity or a `{ data }` relation wrapper. */
export type HandleHandlePositionField =
  | HandlePosition
  | { data: HandlePosition | null }
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
  handlePosition?: HandleHandlePositionField;
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
