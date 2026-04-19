/** Series carcase height is set (> 0) — variant-level height is not used. */
export function seriesLocksVariantHeight(carcaseHeight: unknown): boolean {
  return typeof carcaseHeight === 'number' && Number.isFinite(carcaseHeight) && carcaseHeight > 0;
}

/** From a populated `cabinetType` (flat or `{ data }`) with optional `cabinetSeries`. */
export function variantHeightLockedFromCabinetTypeRelation(cabinetType: unknown): boolean {
  if (!cabinetType || typeof cabinetType !== 'object') return false;
  const ct = cabinetType as Record<string, unknown>;
  let series: unknown = ct.cabinetSeries;
  if (series && typeof series === 'object' && 'data' in series) {
    series = (series as { data: unknown }).data;
  }
  if (!series || typeof series !== 'object') return false;
  const h = (series as { carcaseHeight?: unknown }).carcaseHeight;
  return seriesLocksVariantHeight(h);
}
