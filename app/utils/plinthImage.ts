/** Minimal shape for resolving Strapi media on a plinth (table + modal preview). */
export type PlinthWithImage = {
  image?: unknown;
};

export function extractPlinthImage(
  plinth: PlinthWithImage,
  strapiBase: string,
): { id: number | null; src: string | null } {
  const raw = plinth.image;
  if (raw == null) return { id: null, src: null };

  const base = strapiBase.replace(/\/$/, '');

  function toSrc(path: string | undefined | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  if (
    typeof raw === 'object'
    && raw !== null
    && !Array.isArray(raw)
    && 'url' in raw
  ) {
    const o = raw as {
      id?: number;
      url?: string;
      formats?: { thumbnail?: { url?: string } } | null;
    };
    const thumb = o.formats?.thumbnail?.url;
    const src = toSrc(thumb || o.url);
    const id =
      typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null;
    return { id, src };
  }

  const wrapped = raw as {
    data?: {
      id?: number;
      attributes?: {
        url?: string;
        formats?: { thumbnail?: { url?: string } };
      };
    } | null;
  };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') return { id: null, src: null };
  const id = typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null;
  const attrs = d.attributes ?? (d as unknown as { url?: string; formats?: { thumbnail?: { url?: string } } });
  const thumb = attrs.formats?.thumbnail?.url;
  const src = toSrc(thumb || attrs.url);
  return { id, src };
}
