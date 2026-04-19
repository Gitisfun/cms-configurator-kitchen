import type { StrapiListMeta } from './pagination';
import type { Subcategory } from './subcategory';

export type CabinetSeriesSubcategoryField =
  | Subcategory
  | { data: Subcategory | null }
  | null
  | undefined;

export interface CabinetSeries {
  id: number;
  documentId: string;
  name: string;
  code: string;
  carcaseHeight: number | null;
  defaultCarcaseDepth: number | null;
  productLine: 'standard' | 'cLine' | 'xLine' | null;
  subcategory?: CabinetSeriesSubcategoryField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CabinetSeriesListResponse {
  data: CabinetSeries[];
  meta: StrapiListMeta;
}

export interface CabinetSeriesDocumentResponse {
  data: CabinetSeries;
}
