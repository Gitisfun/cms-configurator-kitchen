import type { StrapiListMeta } from './pagination';
import type { CabinetSeries } from './cabinet-series';
import type { Subcategory } from './subcategory';
import type { CabinetVariant } from './cabinet-variant';
import type { DepthOption } from './depth-option';
import type { CabinetTypeSurchargeLink } from './cabinet-type-surcharge-link';

export type CabinetTypeSubcategoryField =
  | Subcategory
  | { data: Subcategory | null }
  | null
  | undefined;

export type CabinetTypeCabinetSeriesField =
  | CabinetSeries
  | { data: CabinetSeries | null }
  | null
  | undefined;

export type CabinetTypeVariantsField =
  | CabinetVariant[]
  | { data: CabinetVariant[] }
  | null
  | undefined;

export type CabinetTypeDepthOptionsField =
  | DepthOption[]
  | { data: DepthOption[] }
  | null
  | undefined;

export type CabinetTypeSurchargeLinksField =
  | CabinetTypeSurchargeLink[]
  | { data: CabinetTypeSurchargeLink[] }
  | null
  | undefined;

export interface CabinetType {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  image?: unknown;
  orderNumberPrefix: string | null;
  hasLeftRight: boolean;
  hasInternalPanel: boolean;
  depthSurchargeCode: string | null;
  depthOptions?: CabinetTypeDepthOptionsField;
  surchargeLinks?: CabinetTypeSurchargeLinksField;
  subcategory?: CabinetTypeSubcategoryField;
  cabinetSeries?: CabinetTypeCabinetSeriesField;
  variants?: CabinetTypeVariantsField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetTypesResponse {
  data: CabinetType[];
  meta: StrapiListMeta;
}

export interface CabinetTypeDocumentResponse {
  data: CabinetType;
}
