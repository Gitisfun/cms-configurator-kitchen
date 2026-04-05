export interface StrapiListPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiListMeta {
  pagination: StrapiListPagination;
}
