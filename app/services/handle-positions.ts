import type {
  HandlePositionDocumentResponse,
  HandlePositionsResponse,
} from '../models/handle-position';

export type {
  HandlePosition,
  HandlePositionDocumentResponse,
  HandlePositionsResponse,
} from '../models/handle-position';

export const handlePositionsListPath = '/api/handle-positions' as const;

export function handlePositionsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultHandlePositionsResponse(pageSize: number): HandlePositionsResponse {
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

export function getAllHandlePositions(page: number, pageSize: number) {
  return $fetch<HandlePositionsResponse>(handlePositionsListPath, {
    query: handlePositionsListQuery(page, pageSize),
  });
}

export function getHandlePositionById(documentId: string) {
  return $fetch<HandlePositionDocumentResponse>(
    `${handlePositionsListPath}/${encodeURIComponent(documentId)}`,
  );
}

export function createHandlePosition(body: Record<string, unknown>) {
  return $fetch(handlePositionsListPath, {
    method: 'POST',
    body,
  });
}

export function updateHandlePosition(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${handlePositionsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteHandlePosition(documentId: string) {
  return $fetch(`${handlePositionsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
