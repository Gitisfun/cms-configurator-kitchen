import type { CabinetVariantDocumentResponse, CabinetVariantsResponse } from '../models/cabinet-variant';

export type { CabinetVariant, CabinetVariantsResponse, CabinetVariantDocumentResponse } from '../models/cabinet-variant';

export const cabinetVariantsListPath = '/api/cabinet-variants' as const;

export function cabinetVariantsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCabinetVariantsResponse(pageSize: number): CabinetVariantsResponse {
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

export function getAllCabinetVariants(page: number, pageSize: number) {
  return $fetch<CabinetVariantsResponse>(cabinetVariantsListPath, {
    query: cabinetVariantsListQuery(page, pageSize),
  });
}

export function getCabinetVariantById(documentId: string) {
  return $fetch<CabinetVariantDocumentResponse>(`${cabinetVariantsListPath}/${encodeURIComponent(documentId)}`);
}

export function createCabinetVariant(body: Record<string, unknown>) {
  return $fetch(cabinetVariantsListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetVariant(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetVariantsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetVariant(documentId: string) {
  return $fetch(`${cabinetVariantsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
