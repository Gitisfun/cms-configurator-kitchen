import type { StrapiListMeta } from './pagination';
import type { CabinetType } from './cabinet-type';

export type DepthOptionCabinetTypeField =
  | CabinetType
  | { data: CabinetType | null }
  | null
  | undefined;

export interface DepthOption {
  id: number;
  documentId: string;
  name: string;
  depth: number;
  surchargeCode: string | null;
  surchargeAmount: number | string | null;
  isDefault: boolean;
  cabinetType?: DepthOptionCabinetTypeField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface DepthOptionsResponse {
  data: DepthOption[];
  meta: StrapiListMeta;
}

export interface DepthOptionDocumentResponse {
  data: DepthOption;
}
