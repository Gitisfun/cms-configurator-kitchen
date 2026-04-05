import type { StrapiListMeta } from './pagination';
import type { Category } from './category';

export type SubcategoryCategoryField =
  | Category
  | { data: Category | null }
  | null
  | undefined;

export type SubcategoryParentRow = {
  id: number;
  documentId: string;
  name: string;
};

export type SubcategoryParentField =
  | SubcategoryParentRow
  | { data: SubcategoryParentRow | null }
  | null
  | undefined;

export interface Subcategory {
  id: number;
  documentId: string;
  name: string;
  image?: unknown;
  category?: SubcategoryCategoryField;
  parent?: SubcategoryParentField;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface SubcategoriesResponse {
  data: Subcategory[];
  meta: StrapiListMeta;
}

export interface SubcategoryDocumentResponse {
  data: Subcategory;
}
