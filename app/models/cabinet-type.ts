import type { StrapiListMeta } from './pagination';
import type { CabinetSeries } from './cabinet-series';
import type { Subcategory } from './subcategory';
import type { CabinetVariant } from './cabinet-variant';
import type { DepthOption } from './depth-option';
import type { CabinetTypeSurcharge } from './cabinet-type-surcharge';

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

export type CabinetTypeSurchargesField =
  | CabinetTypeSurcharge[]
  | { data: CabinetTypeSurcharge[] }
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
  typeSurcharges?: CabinetTypeSurchargesField;
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
