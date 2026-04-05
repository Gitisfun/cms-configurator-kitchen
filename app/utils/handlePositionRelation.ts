/** Resolve populated Strapi `handlePosition` on a handle (list / detail). */
export function extractHandlePositionRelation(handle: { handlePosition?: unknown }): {
  id: number | null;
  documentId: string | null;
  name: string | null;
} {
  const raw = handle.handlePosition;
  if (raw == null) {
    return { id: null, documentId: null, name: null };
  }

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'documentId' in raw) {
    const o = raw as {
      id?: number;
      documentId?: string;
      name?: string;
    };
    return {
      id: typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null,
      documentId: typeof o.documentId === 'string' ? o.documentId : null,
      name: typeof o.name === 'string' ? o.name : null,
    };
  }

  const wrapped = raw as {
    data?: {
      id?: number;
      documentId?: string;
      name?: string;
      attributes?: { name?: string };
    } | null;
  };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') {
    return { id: null, documentId: null, name: null };
  }
  const id = typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null;
  const documentId = typeof d.documentId === 'string' ? d.documentId : null;
  const name =
    typeof d.name === 'string'
      ? d.name
      : typeof d.attributes?.name === 'string'
        ? d.attributes.name
        : null;
  return { id, documentId, name };
}
