import type { StrapiListMeta } from './pagination';
import type { CabinetType } from './cabinet-type';

export type CabinetTypeSurchargeCabinetTypeField =
  | CabinetType
  | { data: CabinetType | null }
  | null
  | undefined;

export interface CabinetTypeSurcharge {
  id: number;
  documentId: string;
  name: string;
  code: string;
  price: number | string;
  cabinetType?: CabinetTypeSurchargeCabinetTypeField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetTypeSurchargesResponse {
  data: CabinetTypeSurcharge[];
  meta: StrapiListMeta;
}

export interface CabinetTypeSurchargeDocumentResponse {
  data: CabinetTypeSurcharge;
}
