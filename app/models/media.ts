export interface MediaLibraryFile {
  id: number;
  name: string;
  alternativeText: string | null;
  ext: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  thumbnail: string | null;
  createdAt: string;
}

export interface MediaFilesPage {
  data: MediaLibraryFile[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MediaFileRow {
  id: number;
  name: string;
  mime: string;
  url: string;
  thumbnail: string | null;
}

export type MediaPickerFile = MediaFileRow;
