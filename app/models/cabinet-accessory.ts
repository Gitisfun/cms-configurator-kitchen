import type { StrapiListMeta } from './pagination';

export interface CabinetAccessory {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  price: number | string | null;
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetAccessoriesResponse {
  data: CabinetAccessory[];
  meta: StrapiListMeta;
}

export interface CabinetAccessoryDocumentResponse {
  data: CabinetAccessory;
}
