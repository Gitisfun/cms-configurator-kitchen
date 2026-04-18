import type { CabinetAccessoriesResponse, CabinetAccessoryDocumentResponse } from '../models/cabinet-accessory';

export type { CabinetAccessory, CabinetAccessoriesResponse, CabinetAccessoryDocumentResponse } from '../models/cabinet-accessory';

export const cabinetAccessoriesListPath = '/api/cabinet-accessories' as const;

export function cabinetAccessoriesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCabinetAccessoriesResponse(pageSize: number): CabinetAccessoriesResponse {
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

export function getAllCabinetAccessories(page: number, pageSize: number) {
  return $fetch<CabinetAccessoriesResponse>(cabinetAccessoriesListPath, {
    query: cabinetAccessoriesListQuery(page, pageSize),
  });
}

export function getCabinetAccessoryById(documentId: string) {
  return $fetch<CabinetAccessoryDocumentResponse>(`${cabinetAccessoriesListPath}/${encodeURIComponent(documentId)}`);
}

export function createCabinetAccessory(body: Record<string, unknown>) {
  return $fetch(cabinetAccessoriesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetAccessory(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetAccessoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetAccessory(documentId: string) {
  return $fetch(`${cabinetAccessoriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
