import type { StrapiListMeta } from './pagination';
import type { Category } from './category';
import type { Subcategory } from './subcategory';

export type CabinetSeriesSubcategoryField =
  | Subcategory
  | { data: Subcategory | null }
  | null
  | undefined;

export type CabinetSeriesCategoryField =
  | Category
  | { data: Category | null }
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
  category?: CabinetSeriesCategoryField;
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
