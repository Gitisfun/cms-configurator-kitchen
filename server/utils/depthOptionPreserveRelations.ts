import { strapiRelationList } from './strapiRelationList';

type Row = { documentId?: string };

function documentIds(raw: unknown): string[] {
  return strapiRelationList<Row>(raw as Row[] | { data: Row[] } | null | undefined)
    .map((r) => r.documentId)
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '');
}

/**
 * Strapi 5 REST PUT can clear many-to-many relations when omitted.
 * Re-send `set` with existing cabinet-type documentIds so scalar-only updates do not disconnect links.
 */
export function mergePreservedDepthOptionRelations(
  data: Record<string, unknown>,
  existing: Record<string, unknown> | null | undefined,
): void {
  if (!existing) return;
  if ('cabinetTypes' in data) return;

  const c = documentIds(existing.cabinetTypes);
  if (c.length) data.cabinetTypes = { set: c };
}
