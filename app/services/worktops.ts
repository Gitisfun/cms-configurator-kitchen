import type { WorktopDocumentResponse, WorktopsResponse } from '../models/worktop';

export type { Worktop, WorktopDocumentResponse, WorktopsResponse } from '../models/worktop';

export const worktopsListPath = '/api/worktops' as const;

export function worktopsListQuery(page: number, pageSize: number) {
  return {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
  } as const;
}

export function defaultWorktopsResponse(pageSize: number): WorktopsResponse {
  return {
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize,
        pageCount: 1,
        total: 0,
      },
    },
  };
}

export function getAllWorktops(page: number, pageSize: number) {
  return $fetch<WorktopsResponse>(worktopsListPath, {
    query: worktopsListQuery(page, pageSize),
  });
}

export function getWorktopById(documentId: string) {
  return $fetch<WorktopDocumentResponse>(
    `${worktopsListPath}/${encodeURIComponent(documentId)}`,
  );
}

export function createWorktop(body: Record<string, unknown>) {
  return $fetch(worktopsListPath, {
    method: 'POST',
    body,
  });
}

export function updateWorktop(documentId: string, body: Record<string, unknown>) {
  return $fetch(`${worktopsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteWorktop(documentId: string) {
  return $fetch(`${worktopsListPath}/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
}
