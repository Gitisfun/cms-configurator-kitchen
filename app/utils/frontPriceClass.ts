/** Resolve populated Strapi `priceClass` on a front (list / detail). */
export function extractFrontPriceClass(front: { priceClass?: unknown }): {
  id: number | null;
  documentId: string | null;
  name: string | null;
  level: number | null;
} {
  const raw = front.priceClass;
  if (raw == null) {
    return { id: null, documentId: null, name: null, level: null };
  }

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'documentId' in raw) {
    const o = raw as {
      id?: number;
      documentId?: string;
      name?: string;
      level?: number;
    };
    return {
      id: typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null,
      documentId: typeof o.documentId === 'string' ? o.documentId : null,
      name: typeof o.name === 'string' ? o.name : null,
      level: typeof o.level === 'number' && Number.isFinite(o.level) ? o.level : null,
    };
  }

  const wrapped = raw as {
    data?: {
      id?: number;
      documentId?: string;
      name?: string;
      level?: number;
      attributes?: { name?: string; level?: number };
    } | null;
  };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') {
    return { id: null, documentId: null, name: null, level: null };
  }
  const id = typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null;
  const documentId = typeof d.documentId === 'string' ? d.documentId : null;
  const name =
    typeof d.name === 'string'
      ? d.name
      : typeof d.attributes?.name === 'string'
        ? d.attributes.name
        : null;
  const levelRaw = d.level ?? d.attributes?.level;
  const level = typeof levelRaw === 'number' && Number.isFinite(levelRaw) ? levelRaw : null;
  return { id, documentId, name, level };
}
