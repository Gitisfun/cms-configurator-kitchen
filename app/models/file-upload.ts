export type StagedFileStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface StagedFile {
  raw: File;
  preview: string | null;
  status: StagedFileStatus;
}
