export interface Category {
  id: number;
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

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
