export const uploadPath = '/api/upload' as const;
export const uploadFilesListPath = '/api/upload/files' as const;

export interface MediaFileRow {
  id: number;
  name: string;
  mime: string;
  url: string;
  thumbnail: string | null;
}

export type MediaPickerFile = MediaFileRow;

export interface MediaFilesPage {
  data: MediaFileRow[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function uploadMedia(formData: FormData, endpoint: string = uploadPath) {
  return $fetch<unknown>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

export function fetchMediaFilesPage(query: { page: number; pageSize: number }) {
  return $fetch<MediaFilesPage>(uploadFilesListPath, { query });
}

/** First uploaded file id from Strapi-style upload JSON. */
export function parseUploadResponseId(raw: unknown): { id: number } | null {
  if (
    Array.isArray(raw)
    && raw[0]
    && typeof raw[0] === 'object'
    && typeof (raw[0] as { id?: unknown }).id === 'number'
  ) {
    return { id: (raw[0] as { id: number }).id };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (
      Array.isArray(r.data)
      && r.data[0]
      && typeof r.data[0] === 'object'
      && typeof (r.data[0] as { id?: unknown }).id === 'number'
    ) {
      return { id: (r.data[0] as { id: number }).id };
    }
    if (
      r.data
      && typeof r.data === 'object'
      && !Array.isArray(r.data)
      && typeof (r.data as { id?: unknown }).id === 'number'
    ) {
      return { id: (r.data as { id: number }).id };
    }
  }
  return null;
}
