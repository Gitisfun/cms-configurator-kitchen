import type { StrapiListMeta } from './pagination';
import type { CabinetType } from './cabinet-type';

export type DepthOptionCabinetTypesField =
  | CabinetType[]
  | { data: CabinetType[] }
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
  /** Many-to-many: cabinet types that use this depth row. */
  cabinetTypes?: DepthOptionCabinetTypesField;
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
