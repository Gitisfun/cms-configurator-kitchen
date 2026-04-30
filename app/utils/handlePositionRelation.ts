import { strapiRelationList } from './strapiRelationList';

type RawHp = {
  id?: number;
  documentId?: string;
  name?: string;
  attributes?: { name?: string };
};

function parseHandlePositionEntry(raw: unknown): {
  id: number | null;
  documentId: string | null;
  name: string | null;
} {
  if (raw == null) {
    return { id: null, documentId: null, name: null };
  }

  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'documentId' in raw) {
    const o = raw as RawHp;
    return {
      id: typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null,
      documentId: typeof o.documentId === 'string' ? o.documentId : null,
      name:
        typeof o.name === 'string'
          ? o.name
          : typeof o.attributes?.name === 'string'
            ? o.attributes.name
            : null,
    };
  }

  const wrapped = raw as { data?: RawHp | null };
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

/** Normalize populated Strapi `handlePositions` on a handle (list / detail). */
export function extractHandlePositionsRelations(handle: { handlePositions?: unknown }): ReturnType<
  typeof parseHandlePositionEntry
>[] {
  const raw = handle.handlePositions;
  return strapiRelationList(raw as unknown[] | { data: unknown[] } | null | undefined).map((item) =>
    parseHandlePositionEntry(item),
  );
}

/** First linked handle position (legacy helper). */
export function extractHandlePositionRelation(handle: { handlePositions?: unknown }): {
  id: number | null;
  documentId: string | null;
  name: string | null;
} {
  const list = extractHandlePositionsRelations(handle);
  if (!list.length) {
    return { id: null, documentId: null, name: null };
  }
  return list[0]!;
}
