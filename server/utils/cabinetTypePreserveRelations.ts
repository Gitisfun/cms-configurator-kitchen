import { strapiRelationList } from './strapiRelationList';

type Row = { documentId?: string };

function documentIds(raw: unknown): string[] {
  return strapiRelationList<Row>(raw as Row[] | { data: Row[] } | null | undefined)
    .map((r) => r.documentId)
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '');
}

/**
 * Strapi 5 REST PUT can clear inverse relations (variants, depth options, etc.) when omitted.
 * Re-send `set` with existing documentIds so scalar-only updates do not disconnect children.
 */
export function mergePreservedCabinetTypeRelations(
  data: Record<string, unknown>,
  existing: Record<string, unknown> | null | undefined,
): void {
  if (!existing) return;

  const v = documentIds(existing.variants);
  if (v.length) data.variants = { set: v };

  const d = documentIds(existing.depthOptions);
  if (d.length) data.depthOptions = { set: d };

  const a = documentIds(existing.accessories);
  if (a.length) data.accessories = { set: a };

  const sl = documentIds(existing.surchargeLinks);
  if (sl.length) data.surchargeLinks = { set: sl };
}
