export function extractSubcategoryCategory(sub: { category?: unknown }): {
  id: number | null;
  name: string | null;
} {
  const raw = sub.category;
  if (raw == null) {
    return { id: null, name: null };
  }

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'documentId' in raw) {
    const o = raw as { id?: number; name?: string };
    return {
      id: typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null,
      name: typeof o.name === 'string' ? o.name : null,
    };
  }

  const wrapped = raw as { data?: { id?: number; name?: string } | null };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') {
    return { id: null, name: null };
  }
  return {
    id: typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null,
    name: typeof d.name === 'string' ? d.name : null,
  };
}

export function extractSubcategoryParentRef(sub: { parent?: unknown }): {
  id: number | null;
  documentId: string | null;
  name: string | null;
} {
  const raw = sub.parent;
  if (raw == null) {
    return { id: null, documentId: null, name: null };
  }

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'documentId' in raw) {
    const o = raw as { id?: number; documentId?: string; name?: string };
    return {
      id: typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null,
      documentId: typeof o.documentId === 'string' ? o.documentId : null,
      name: typeof o.name === 'string' ? o.name : null,
    };
  }

  const wrapped = raw as {
    data?: { id?: number; documentId?: string; name?: string } | null;
  };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') {
    return { id: null, documentId: null, name: null };
  }
  return {
    id: typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null,
    documentId: typeof d.documentId === 'string' ? d.documentId : null,
    name: typeof d.name === 'string' ? d.name : null,
  };
}

/** Single-line label for table: exactly one of category or parent should be set. */
export function formatSubcategoryParentLine(sub: {
  category?: unknown;
  parent?: unknown;
}): string {
  const c = extractSubcategoryCategory(sub);
  if (c.name) {
    return `Category: ${c.name}`;
  }
  const p = extractSubcategoryParentRef(sub);
  if (p.name) {
    return `Subcategory: ${p.name}`;
  }
  return '—';
}
