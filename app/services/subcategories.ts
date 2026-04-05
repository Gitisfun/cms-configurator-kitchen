import type {
  SubcategoriesResponse,
  SubcategoryDocumentResponse,
} from '../models/subcategory';

export type {
  Subcategory,
  SubcategoriesResponse,
  SubcategoryDocumentResponse,
} from '../models/subcategory';

export const subcategoriesListPath = '/api/subcategories' as const;

export function subcategoriesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultSubcategoriesResponse(pageSize: number): SubcategoriesResponse {
  return {
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize,
        pageCount: 1,
        total: 0,
      },
    },
  };
}

export function getAllSubcategories(page: number, pageSize: number) {
  return $fetch<SubcategoriesResponse>(subcategoriesListPath, {
    query: subcategoriesListQuery(page, pageSize),
  });
}

export function getSubcategoryById(documentId: string) {
  return $fetch<SubcategoryDocumentResponse>(
    `${subcategoriesListPath}/${encodeURIComponent(documentId)}`,
  );
}

export function createSubcategory(body: Record<string, unknown>) {
  return $fetch(subcategoriesListPath, {
    method: 'POST',
    body,
  });
}

export function updateSubcategory(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${subcategoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteSubcategory(documentId: string) {
  return $fetch(`${subcategoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
