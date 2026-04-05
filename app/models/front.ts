import type { StrapiListMeta } from './pagination';
import type { PriceClass } from './price-class';

/** Strapi may return a populated entity or a `{ data }` relation wrapper. */
export type FrontPriceClassField =
  | PriceClass
  | { data: PriceClass | null }
  | null
  | undefined;

export interface Front {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  image?: unknown;
  priceClass?: FrontPriceClassField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface FrontsResponse {
  data: Front[];
  meta: StrapiListMeta;
}

export interface FrontDocumentResponse {
  data: Front;
}
