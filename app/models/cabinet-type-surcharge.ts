import type { StrapiListMeta } from './pagination';

/** When set, the surcharge applies to this cabinet dimension; omit or null for a global/fixed fee. */
export type CabinetTypeSurchargeDimension = 'height' | 'width' | 'depth';

export interface CabinetTypeSurcharge {
  id: number;
  documentId: string;
  name: string;
  code: string;
  dimension?: CabinetTypeSurchargeDimension | null;
  value?: number | string | null;
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
