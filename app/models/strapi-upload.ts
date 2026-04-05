export interface StrapiMetaPagination {
  page?: number;
  pageSize?: number;
  pageCount?: number;
  total?: number;
  start?: number;
  limit?: number;
}

export interface StrapiFileFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface StrapiFile {
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
