import type { H3Event } from 'h3';
import { getRequestURL } from 'h3';

type StrapiList<T> = {
  data: T[];
  meta: { pagination: { page: number; pageCount: number; pageSize: number; total: number } };
};

export function apiOrigin(event: H3Event): string {
  return getRequestURL(event).origin;
}

export type PriceClassResolutionRow = {
  id: number;
  level: number;
  priceIndex?: number | null;
};

/** Maps catalog JSON `class` / column index to Strapi price-class numeric id. */
export type PriceClassResolutionMaps = {
  byLevel: Map<number, number>;
  byPriceIndex: Map<number, number>;
  /** Column order (e.g. UI left-to-right): priceIndex asc, then level asc. */
  orderedIds: number[];
};

/**
 * Resolves `catalogClass` from import JSON:
 * 1) Strapi `priceIndex` (when set) — matches column index 0…n in many sheets
 * 2) Strapi `level` — matches UI “Price groups” header number
 * 3) Positional index into `orderedIds` — for `[p0,p1,…]` arrays aligned with columns
 */
export function resolvePriceClassNumericId(
  catalogClass: number,
  maps: PriceClassResolutionMaps,
): number | undefined {
  if (!Number.isInteger(catalogClass)) return undefined;

  const byPi = maps.byPriceIndex.get(catalogClass);
  if (byPi != null) return byPi;

  const byLv = maps.byLevel.get(catalogClass);
  if (byLv != null) return byLv;

  if (catalogClass >= 0 && catalogClass < maps.orderedIds.length) {
    return maps.orderedIds[catalogClass];
  }

  return undefined;
}

export async function fetchPriceClassResolutionMaps(event: H3Event): Promise<PriceClassResolutionMaps> {
  const origin = apiOrigin(event);
  const rows: PriceClassResolutionRow[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await $fetch<StrapiList<PriceClassResolutionRow>>(`${origin}/api/price-classes`, {
      query: {
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        'sort[0]': 'level:asc',
      },
    });
    rows.push(...res.data);
    if (page >= res.meta.pagination.pageCount || res.data.length === 0) break;
    page += 1;
  }

  const byLevel = new Map<number, number>();
  const byPriceIndex = new Map<number, number>();
  for (const row of rows) {
    if (!byLevel.has(row.level)) byLevel.set(row.level, row.id);
    if (
      row.priceIndex != null &&
      typeof row.priceIndex === 'number' &&
      Number.isInteger(row.priceIndex) &&
      !byPriceIndex.has(row.priceIndex)
    ) {
      byPriceIndex.set(row.priceIndex, row.id);
    }
  }

  const orderedIds = [...rows]
    .sort((a, b) => {
      const ai = a.priceIndex != null && Number.isInteger(a.priceIndex) ? a.priceIndex : 1_000_000;
      const bi = b.priceIndex != null && Number.isInteger(b.priceIndex) ? b.priceIndex : 1_000_000;
      if (ai !== bi) return ai - bi;
      return a.level - b.level;
    })
    .map((r) => r.id);

  return { byLevel, byPriceIndex, orderedIds };
}

export async function fetchAllDepthOptions(
  event: H3Event,
): Promise<Array<{ id: number; documentId: string; name: string; depth: number }>> {
  const origin = apiOrigin(event);
  const out: Array<{ id: number; documentId: string; name: string; depth: number }> = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await $fetch<
      StrapiList<{ id: number; documentId: string; name: string; depth: number }>
    >(`${origin}/api/depth-options`, {
      query: {
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
    });
    out.push(...res.data);
    if (page >= res.meta.pagination.pageCount || res.data.length === 0) break;
    page += 1;
  }
  return out;
}

export async function fetchAllCabinetTypeSurcharges(
  event: H3Event,
): Promise<Array<{ id: number; documentId: string; name: string; code: string }>> {
  const origin = apiOrigin(event);
  const out: Array<{ id: number; documentId: string; name: string; code: string }> = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await $fetch<
      StrapiList<{ id: number; documentId: string; name: string; code: string }>
    >(`${origin}/api/cabinet-type-surcharges`, {
      query: {
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
      },
    });
    out.push(...res.data);
    if (page >= res.meta.pagination.pageCount || res.data.length === 0) break;
    page += 1;
  }
  return out;
}

type SurchargeLinkRow = {
  id: number;
  documentId: string;
  surcharge?: { data?: { id: number } } | { id: number } | null;
};

export async function fetchSurchargeLinksForCabinetType(
  event: H3Event,
  cabinetTypeNumericId: number,
): Promise<SurchargeLinkRow[]> {
  const origin = apiOrigin(event);
  const out: SurchargeLinkRow[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await $fetch<StrapiList<SurchargeLinkRow>>(`${origin}/api/cabinet-type-surcharge-links`, {
      query: {
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        'filters[cabinetType][id][$eq]': cabinetTypeNumericId,
        'populate[surcharge]': 'true',
      },
    });
    out.push(...res.data);
    if (page >= res.meta.pagination.pageCount || res.data.length === 0) break;
    page += 1;
  }
  return out;
}

function surchargeIdFromLink(link: SurchargeLinkRow): number | null {
  const s = link.surcharge;
  if (!s) return null;
  if (typeof s === 'object' && 'data' in s && s.data && typeof s.data === 'object' && 'id' in s.data) {
    return typeof (s.data as { id: number }).id === 'number' ? (s.data as { id: number }).id : null;
  }
  if (typeof s === 'object' && 'id' in s && typeof (s as { id: number }).id === 'number') {
    return (s as { id: number }).id;
  }
  return null;
}

export function findLinkForSurchargeId(links: SurchargeLinkRow[], surchargeNumericId: number): SurchargeLinkRow | null {
  for (const link of links) {
    const sid = surchargeIdFromLink(link);
    if (sid === surchargeNumericId) return link;
  }
  return null;
}
