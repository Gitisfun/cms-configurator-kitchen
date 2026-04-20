import type { StrapiListMeta } from './pagination';
import type { PriceClass } from './price-class';

export type CabinetTypeSurchargePricePriceClassField =
  | PriceClass
  | { data: PriceClass | null }
  | null
  | undefined;

export interface CabinetTypeSurchargePrice {
  id: number;
  documentId: string;
  price: number | string;
  priceClass?: CabinetTypeSurchargePricePriceClassField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetTypeSurchargePricesResponse {
  data: CabinetTypeSurchargePrice[];
  meta: StrapiListMeta;
}
