import type {
  CabinetTypeSurchargeDocumentResponse,
  CabinetTypeSurchargesResponse,
} from '../models/cabinet-type-surcharge';

export type {
  CabinetTypeSurcharge,
  CabinetTypeSurchargesResponse,
  CabinetTypeSurchargeDocumentResponse,
} from '../models/cabinet-type-surcharge';

export const cabinetTypeSurchargesListPath = '/api/cabinet-type-surcharges' as const;

export function cabinetTypeSurchargesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCabinetTypeSurchargesResponse(pageSize: number): CabinetTypeSurchargesResponse {
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

export function getAllCabinetTypeSurcharges(page: number, pageSize: number) {
  return $fetch<CabinetTypeSurchargesResponse>(cabinetTypeSurchargesListPath, {
    query: cabinetTypeSurchargesListQuery(page, pageSize),
  });
}

export function createCabinetTypeSurcharge(body: Record<string, unknown>) {
  return $fetch(cabinetTypeSurchargesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetTypeSurcharge(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetTypeSurchargesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetTypeSurcharge(documentId: string) {
  return $fetch(`${cabinetTypeSurchargesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
