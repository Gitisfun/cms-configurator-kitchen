import type { CabinetSeriesDocumentResponse, CabinetSeriesListResponse } from '../models/cabinet-series';

export type { CabinetSeries, CabinetSeriesListResponse, CabinetSeriesDocumentResponse } from '../models/cabinet-series';

export const cabinetSeriesListPath = '/api/cabinet-series' as const;

export function cabinetSeriesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCabinetSeriesResponse(pageSize: number): CabinetSeriesListResponse {
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

export function getAllCabinetSeries(page: number, pageSize: number) {
  return $fetch<CabinetSeriesListResponse>(cabinetSeriesListPath, {
    query: cabinetSeriesListQuery(page, pageSize),
  });
}

export function getCabinetSeriesById(documentId: string) {
  return $fetch<CabinetSeriesDocumentResponse>(`${cabinetSeriesListPath}/${encodeURIComponent(documentId)}`);
}

export function createCabinetSeries(body: Record<string, unknown>) {
  return $fetch(cabinetSeriesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetSeries(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetSeriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetSeries(documentId: string) {
  return $fetch(`${cabinetSeriesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
