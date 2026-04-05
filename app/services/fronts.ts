import type { FrontDocumentResponse, FrontsResponse } from '../models/front';

export type { Front, FrontDocumentResponse, FrontsResponse } from '../models/front';

export const frontsListPath = '/api/fronts' as const;

export function frontsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultFrontsResponse(pageSize: number): FrontsResponse {
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

export function getAllFronts(page: number, pageSize: number) {
  return $fetch<FrontsResponse>(frontsListPath, {
    query: frontsListQuery(page, pageSize),
  });
}

export function getFrontById(documentId: string) {
  return $fetch<FrontDocumentResponse>(`${frontsListPath}/${encodeURIComponent(documentId)}`);
}

export function createFront(body: Record<string, unknown>) {
  return $fetch(frontsListPath, {
    method: 'POST',
    body,
  });
}

export function updateFront(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${frontsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteFront(documentId: string) {
  return $fetch(`${frontsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
