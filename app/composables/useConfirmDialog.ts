export type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Primary button uses destructive styling when true (default true). */
  danger?: boolean;
};

export const confirmDialogState = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  danger: true,
});

let pendingResolve: ((value: boolean) => void) | null = null;

export function settleConfirmDialog(result: boolean) {
  confirmDialogState.open = false;
  pendingResolve?.(result);
  pendingResolve = null;
}

export function useConfirmDialog() {
  function requestConfirm(options: ConfirmDialogOptions): Promise<boolean> {
    if (pendingResolve) {
      pendingResolve(false);
      pendingResolve = null;
    }
    confirmDialogState.title = options.title;
    confirmDialogState.message = options.message;
    confirmDialogState.confirmLabel = options.confirmLabel ?? 'Delete';
    confirmDialogState.cancelLabel = options.cancelLabel ?? 'Cancel';
    confirmDialogState.danger = options.danger ?? true;
    confirmDialogState.open = true;
    return new Promise<boolean>((resolve) => {
      pendingResolve = resolve;
    });
  }

  return { requestConfirm };
}
