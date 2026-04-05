import type { PriceClassDocumentResponse, PriceClassesResponse } from '../models/price-class';

export type { PriceClass, PriceClassDocumentResponse, PriceClassesResponse } from '../models/price-class';

export const priceClassesListPath = '/api/price-classes' as const;

export function priceClassesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultPriceClassesResponse(pageSize: number): PriceClassesResponse {
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

export function getAllPriceClasses(page: number, pageSize: number) {
  return $fetch<PriceClassesResponse>(priceClassesListPath, {
    query: priceClassesListQuery(page, pageSize),
  });
}

export function getPriceClassById(documentId: string) {
  return $fetch<PriceClassDocumentResponse>(`${priceClassesListPath}/${encodeURIComponent(documentId)}`);
}

export function createPriceClass(body: { name: string; level: number }) {
  return $fetch(priceClassesListPath, {
    method: 'POST',
    body,
  });
}

export function updatePriceClass(documentId: string, body: { name: string; level: number }) {
  return $fetch(`${priceClassesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deletePriceClass(documentId: string) {
  return $fetch(`${priceClassesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
