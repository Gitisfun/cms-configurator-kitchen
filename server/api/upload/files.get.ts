function mapFile(config: { strapiUrl: string }, file: StrapiFile) {
  return {
    id: file.id,
    name: file.name,
    alternativeText: file.alternativeText,
    ext: file.ext,
    mime: file.mime,
    size: file.size,
    width: file.width,
    height: file.height,
    url: `${config.strapiUrl}${file.url}`,
    thumbnail: file.formats?.thumbnail
      ? `${config.strapiUrl}${file.formats.thumbnail.url}`
      : null,
    createdAt: file.createdAt,
  };
}

/** Strapi may return a bare array (v4 upload) or a wrapped REST shape (some v5 / middleware). */
function unwrapStrapiFiles(raw: unknown): {
  files: StrapiFile[];
  pagination?: StrapiMetaPagination;
} {
  if (Array.isArray(raw)) {
    return { files: raw as StrapiFile[] };
  }
  if (
    raw
    && typeof raw === 'object'
    && 'data' in raw
    && Array.isArray((raw as { data: unknown }).data)
  ) {
    const body = raw as { data: StrapiFile[]; meta?: { pagination?: StrapiMetaPagination } };
    return {
      files: body.data,
      pagination: body.meta?.pagination,
    };
  }
  return { files: [] };
}

/**
 * Build query string the way Strapi’s qs parser expects (bracket notation).
 * Avoid relying on ofetch/ufo flattening of nested `pagination` objects.
 */
function strapiUploadFilesQuery(start: number, limit: number): string {
  const p = new URLSearchParams();
  p.append('pagination[start]', String(start));
  p.append('pagination[limit]', String(limit));
  p.append('sort', 'createdAt:desc');
  return p.toString();
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);

  const page = Math.max(1, Number(query.page) || 1);
  const rawSize = Number(query.pageSize);
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(rawSize) ? rawSize : 24));
  const start = (page - 1) * pageSize;
  const limit = pageSize + 1;

  const qs = strapiUploadFilesQuery(start, limit);
  const url = `${config.strapiUrl}/api/upload/files?${qs}`;

  const raw = await $fetch<unknown>(url, {
    headers: {
      Authorization: `Bearer ${config.strapiToken}`,
    },
  });

  let { files, pagination } = unwrapStrapiFiles(raw);

  let hasNextPage: boolean;
  let slice: StrapiFile[];

  if (files.length > limit) {
    // Returned more than we asked for — upstream ignored `pagination[limit]`; slice locally.
    const sorted = [...files].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const windowed = sorted.slice(start, start + limit);
    hasNextPage = windowed.length > pageSize;
    slice = hasNextPage ? windowed.slice(0, pageSize) : windowed;
  } else if (pagination && typeof pagination === 'object') {
    const pageCount = pagination.pageCount;
    const currentPage = pagination.page;
    const total = pagination.total;

    if (typeof pageCount === 'number' && typeof currentPage === 'number') {
      hasNextPage = currentPage < pageCount;
    } else if (typeof total === 'number') {
      hasNextPage = start + files.length < total;
    } else {
      hasNextPage = files.length > pageSize;
    }
    slice = files.length > pageSize ? files.slice(0, pageSize) : files;
  } else {
    hasNextPage = files.length > pageSize;
    slice = hasNextPage ? files.slice(0, pageSize) : files;
  }

  return {
    data: slice.map((file) => mapFile(config, file)),
    page,
    pageSize,
    hasNextPage,
    hasPreviousPage: page > 1,
  };
});

interface StrapiMetaPagination {
  page?: number;
  pageSize?: number;
  pageCount?: number;
  total?: number;
  start?: number;
  limit?: number;
}

interface StrapiFileFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

interface StrapiFile {
  id: number;
  name: string;
  alternativeText: string | null;
  ext: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  formats: {
    thumbnail?: StrapiFileFormat;
    small?: StrapiFileFormat;
    medium?: StrapiFileFormat;
    large?: StrapiFileFormat;
  } | null;
  createdAt: string;
}
