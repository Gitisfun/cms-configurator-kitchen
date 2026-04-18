/** Numeric id on a Strapi entity or populated relation (flat or `{ data }`). */
export function extractRelationNumericId(rel: unknown): number | null {
  if (!rel || typeof rel !== 'object') return null;
  const o = rel as Record<string, unknown>;
  if (typeof o.id === 'number' && Number.isFinite(o.id)) return o.id;
  if (o.data != null && typeof o.data === 'object' && o.data !== null && 'id' in o.data) {
    const id = (o.data as { id: unknown }).id;
    if (typeof id === 'number' && Number.isFinite(id)) return id;
  }
  return null;
}

/** documentId on a Strapi 5 entity or populated relation (flat or `{ data }`). */
export function extractRelationDocumentId(rel: unknown): string | null {
  if (!rel || typeof rel !== 'object') return null;
  const o = rel as Record<string, unknown>;
  if (typeof o.documentId === 'string' && o.documentId.trim()) return o.documentId;
  if (o.data != null && typeof o.data === 'object' && o.data !== null && 'documentId' in o.data) {
    const d = (o.data as { documentId: unknown }).documentId;
    if (typeof d === 'string' && d.trim()) return d;
  }
  return null;
}
