import type { CategoriesResponse } from '../models/category';

export type { Category, CategoriesResponse } from '../models/category';

export const categoriesListPath = '/api/categories' as const;

export function categoriesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCategoriesResponse(pageSize: number): CategoriesResponse {
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

export function getAllCategories(page: number, pageSize: number) {
  return $fetch<CategoriesResponse>(categoriesListPath, {
    query: categoriesListQuery(page, pageSize),
  });
}

export function createCategory(body: { name: string }) {
  return $fetch(categoriesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCategory(documentId: string, body: { name: string }) {
  return $fetch(`${categoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCategory(documentId: string) {
  return $fetch(`${categoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
