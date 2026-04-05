import type { HandleDocumentResponse, HandlesResponse } from '../models/handle';

export type { Handle, HandleDocumentResponse, HandlesResponse } from '../models/handle';

export const handlesListPath = '/api/handles' as const;

export function handlesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultHandlesResponse(pageSize: number): HandlesResponse {
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

export function getAllHandles(page: number, pageSize: number) {
  return $fetch<HandlesResponse>(handlesListPath, {
    query: handlesListQuery(page, pageSize),
  });
}

export function getHandleById(documentId: string) {
  return $fetch<HandleDocumentResponse>(`${handlesListPath}/${encodeURIComponent(documentId)}`);
}

export function createHandle(body: Record<string, unknown>) {
  return $fetch(handlesListPath, {
    method: 'POST',
    body,
  });
}

export function updateHandle(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${handlesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteHandle(documentId: string) {
  return $fetch(`${handlesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
