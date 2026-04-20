import type { StrapiListMeta } from './pagination';
import type { CabinetType } from './cabinet-type';
import type { CabinetTypeSurcharge } from './cabinet-type-surcharge';
import type { CabinetTypeSurchargePrice } from './cabinet-type-surcharge-price';

export type CabinetTypeSurchargeLinkSurchargeField =
  | CabinetTypeSurcharge
  | { data: CabinetTypeSurcharge | null }
  | null
  | undefined;

export type CabinetTypeSurchargeLinkCabinetTypeField =
  | CabinetType
  | { data: CabinetType | null }
  | null
  | undefined;

export type CabinetTypeSurchargeLinkPricesField =
  | CabinetTypeSurchargePrice[]
  | { data: CabinetTypeSurchargePrice[] }
  | null
  | undefined;

export interface CabinetTypeSurchargeLink {
  id: number;
  documentId: string;
  surcharge?: CabinetTypeSurchargeLinkSurchargeField;
  cabinetType?: CabinetTypeSurchargeLinkCabinetTypeField;
  prices?: CabinetTypeSurchargeLinkPricesField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetTypeSurchargeLinksResponse {
  data: CabinetTypeSurchargeLink[];
  meta: StrapiListMeta;
}

export interface CabinetTypeSurchargeLinkDocumentResponse {
  data: CabinetTypeSurchargeLink;
}
