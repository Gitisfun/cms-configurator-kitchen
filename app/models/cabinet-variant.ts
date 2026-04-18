import type { StrapiListMeta } from './pagination';
import type { CabinetType } from './cabinet-type';
import type { CabinetPrice } from './cabinet-price';

export type CabinetVariantCabinetTypeField =
  | CabinetType
  | { data: CabinetType | null }
  | null
  | undefined;

export type CabinetVariantPricesField =
  | CabinetPrice[]
  | { data: CabinetPrice[] }
  | null
  | undefined;

export interface CabinetVariant {
  id: number;
  documentId: string;
  orderNumber: string;
  width: number;
  isVariableWidth: boolean;
  minWidth: number | null;
  maxWidth: number | null;
  height: number | null;
  cabinetType?: CabinetVariantCabinetTypeField;
  prices?: CabinetVariantPricesField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetVariantsResponse {
  data: CabinetVariant[];
  meta: StrapiListMeta;
}

export interface CabinetVariantDocumentResponse {
  data: CabinetVariant;
}
