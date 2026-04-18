import type { StrapiListMeta } from './pagination';
import type { CabinetVariant } from './cabinet-variant';
import type { PriceClass } from './price-class';

export type CabinetPriceVariantField =
  | CabinetVariant
  | { data: CabinetVariant | null }
  | null
  | undefined;

export type CabinetPricePriceClassField =
  | PriceClass
  | { data: PriceClass | null }
  | null
  | undefined;

export interface CabinetPrice {
  id: number;
  documentId: string;
  price: number | string;
  cabinetVariant?: CabinetPriceVariantField;
  priceClass?: CabinetPricePriceClassField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetPricesResponse {
  data: CabinetPrice[];
  meta: StrapiListMeta;
}

export interface CabinetPriceDocumentResponse {
  data: CabinetPrice;
}
