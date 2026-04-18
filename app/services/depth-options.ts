import type { DepthOptionDocumentResponse, DepthOptionsResponse } from '../models/depth-option';

export type { DepthOption, DepthOptionsResponse, DepthOptionDocumentResponse } from '../models/depth-option';

export const depthOptionsListPath = '/api/depth-options' as const;

export function depthOptionsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function depthOptionsForCabinetTypeQuery(cabinetTypeNumericId: number, page: number, pageSize: number) {
  return {
    'filters[cabinetType][id][$eq]': cabinetTypeNumericId,
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort[0]': 'depth:asc',
  } as const;
}

export function defaultDepthOptionsResponse(pageSize: number): DepthOptionsResponse {
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

export function getAllDepthOptions(page: number, pageSize: number) {
  return $fetch<DepthOptionsResponse>(depthOptionsListPath, {
    query: depthOptionsListQuery(page, pageSize),
  });
}

export function getDepthOptionsForCabinetType(cabinetTypeNumericId: number, page = 1, pageSize = 100) {
  return $fetch<DepthOptionsResponse>(depthOptionsListPath, {
    query: depthOptionsForCabinetTypeQuery(cabinetTypeNumericId, page, pageSize),
  });
}

export function getDepthOptionById(documentId: string) {
  return $fetch<DepthOptionDocumentResponse>(`${depthOptionsListPath}/${encodeURIComponent(documentId)}`);
}

export function createDepthOption(body: Record<string, unknown>) {
  return $fetch(depthOptionsListPath, {
    method: 'POST',
    body,
  });
}

export function updateDepthOption(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${depthOptionsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteDepthOption(documentId: string) {
  return $fetch(`${depthOptionsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
