import type { BackDocumentResponse, BacksResponse } from '../models/back';

export type { Back, BackDocumentResponse, BacksResponse } from '../models/back';

export const backsListPath = '/api/backs' as const;

export function backsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultBacksResponse(pageSize: number): BacksResponse {
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

export function getAllBacks(page: number, pageSize: number) {
  return $fetch<BacksResponse>(backsListPath, {
    query: backsListQuery(page, pageSize),
  });
}

export function getBackById(documentId: string) {
  return $fetch<BackDocumentResponse>(`${backsListPath}/${encodeURIComponent(documentId)}`);
}

export function createBack(body: Record<string, unknown>) {
  return $fetch(backsListPath, {
    method: 'POST',
    body,
  });
}

export function updateBack(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${backsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteBack(documentId: string) {
  return $fetch(`${backsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
