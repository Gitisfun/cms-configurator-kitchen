import type { CabinetTypeDocumentResponse, CabinetTypesResponse } from '../models/cabinet-type';

export type { CabinetType, CabinetTypesResponse, CabinetTypeDocumentResponse } from '../models/cabinet-type';

export const cabinetTypesListPath = '/api/cabinet-types' as const;

export function cabinetTypesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'populate[depthOptions]': 'true',
  } as const;
}

/** Cabinet types for a series with variants, prices, and price classes (catalog workspace). */
export function cabinetTypesCatalogQuery(seriesNumericId: number, pageSize = 200) {
  return {
    'filters[cabinetSeries][id][$eq]': seriesNumericId,
    'pagination[page]': 1,
    'pagination[pageSize]': pageSize,
    'sort[0]': 'name:asc',
    'populate[image]': 'true',
    'populate[subcategory]': 'true',
    /** Required so “Edit type” from the catalog can pre-fill series; omitting it sent null and unlinked the type. */
    'populate[cabinetSeries]': 'true',
    // Strapi 5: list nested populate + deep populate on prices (both help depending on version)
    'populate[variants][populate][0]': 'prices',
    'populate[variants][populate][prices][populate][0]': 'priceClass',
    'populate[depthOptions]': 'true',
    'populate[typeSurcharges]': 'true',
  } as const;
}

export function defaultCabinetTypesResponse(pageSize: number): CabinetTypesResponse {
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

export function getAllCabinetTypes(page: number, pageSize: number) {
  return $fetch<CabinetTypesResponse>(cabinetTypesListPath, {
    query: cabinetTypesListQuery(page, pageSize),
  });
}

export function getCabinetTypesCatalogForSeries(seriesNumericId: number, pageSize = 200) {
  return $fetch<CabinetTypesResponse>(cabinetTypesListPath, {
    query: cabinetTypesCatalogQuery(seriesNumericId, pageSize),
  });
}

export function getCabinetTypeById(documentId: string) {
  return $fetch<CabinetTypeDocumentResponse>(`${cabinetTypesListPath}/${encodeURIComponent(documentId)}`);
}

export function createCabinetType(body: Record<string, unknown>) {
  return $fetch(cabinetTypesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetType(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetTypesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetType(documentId: string) {
  return $fetch(`${cabinetTypesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
