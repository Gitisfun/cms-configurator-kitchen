import type { CabinetPrice, CabinetPriceDocumentResponse, CabinetPricesResponse } from '../models/cabinet-price';

export type { CabinetPrice, CabinetPricesResponse, CabinetPriceDocumentResponse } from '../models/cabinet-price';

export const cabinetPricesListPath = '/api/cabinet-prices' as const;

export function cabinetPricesListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultCabinetPricesResponse(pageSize: number): CabinetPricesResponse {
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

export function getAllCabinetPrices(page: number, pageSize: number) {
  return $fetch<CabinetPricesResponse>(cabinetPricesListPath, {
    query: cabinetPricesListQuery(page, pageSize),
  });
}

const VARIANT_ID_FILTER_CHUNK = 45;

function cabinetPricesQueryForVariantIdsChunk(variantNumericIds: number[]) {
  const q: Record<string, string | number> = {
    'pagination[page]': 1,
    'pagination[pageSize]': Math.min(1000, variantNumericIds.length * 24 + 24),
    'populate[priceClass]': 'true',
  };
  variantNumericIds.forEach((id, i) => {
    q[`filters[cabinetVariant][id][$in][${i}]`] = id;
  });
  return q;
}

/** Load prices for many variants (catalog matrix). Chunks `$in` to stay within query limits. */
export async function fetchCabinetPricesForVariantIds(variantNumericIds: number[]): Promise<CabinetPrice[]> {
  const unique = [...new Set(variantNumericIds)].filter((id) => typeof id === 'number' && Number.isFinite(id));
  if (unique.length === 0) return [];
  const out: CabinetPrice[] = [];
  for (let i = 0; i < unique.length; i += VARIANT_ID_FILTER_CHUNK) {
    const chunk = unique.slice(i, i + VARIANT_ID_FILTER_CHUNK);
    const res = await $fetch<CabinetPricesResponse>(cabinetPricesListPath, {
      query: cabinetPricesQueryForVariantIdsChunk(chunk),
    });
    out.push(...res.data);
  }
  return out;
}

export function getCabinetPriceById(documentId: string) {
  return $fetch<CabinetPriceDocumentResponse>(`${cabinetPricesListPath}/${encodeURIComponent(documentId)}`);
}

export function createCabinetPrice(body: Record<string, unknown>) {
  return $fetch(cabinetPricesListPath, {
    method: 'POST',
    body,
  });
}

export function updateCabinetPrice(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${cabinetPricesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCabinetPrice(documentId: string) {
  return $fetch(`${cabinetPricesListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
