export interface Plinth {
  id: number;
  documentId: string;
  name: string;
  price: number | string | null;
  color: string | null;
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PlinthsResponse {
  data: Plinth[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export const plinthsListPath = '/api/plinths' as const;

export function plinthsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultPlinthsResponse(pageSize: number): PlinthsResponse {
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

export function createPlinth(body: Record<string, unknown>) {
  return $fetch(plinthsListPath, {
    method: 'POST',
    body,
  });
}

export function updatePlinth(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${plinthsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deletePlinth(documentId: string) {
  return $fetch(`${plinthsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
