import { computed } from 'vue';

export type ToastVariant = 'success' | 'info' | 'danger';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

type ToastStore = {
  items: ToastItem[];
  seq: number;
};

const STORE_KEY = '__cms_toast_store__';
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const MAX_VISIBLE = 5;
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4200,
  info: 3800,
  danger: 7200,
};

function clearTimer(id: number) {
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.delete(id);
}

function getStore(): ToastStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: ToastStore };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      items: [],
      seq: 0,
    };
  }
  return g[STORE_KEY];
}

export function dismissToast(id: number) {
  clearTimer(id);
  const store = getStore();
  store.items = store.items.filter((x) => x.id !== id);
}

export function useToast() {
  const items = computed<ToastItem[]>({
    get: () => getStore().items,
    set: (next) => {
      getStore().items = next;
    },
  });

  function push(message: string, variant: ToastVariant, durationMs?: number) {
    const trimmed = message.trim();
    if (!trimmed) return null;

    const store = getStore();
    store.seq += 1;
    const id = store.seq;
    const duration = durationMs ?? DEFAULT_DURATION[variant];

    while (items.value.length >= MAX_VISIBLE) {
      const dropped = items.value[0];
      if (dropped) dismissToast(dropped.id);
      else break;
    }

    items.value = [...items.value, { id, variant, message: trimmed }];

    if (duration > 0 && typeof window !== 'undefined') {
      timers.set(id, setTimeout(() => dismissToast(id), duration));
    }

    return id;
  }

  return {
    items,
    success: (message: string, durationMs?: number) => push(message, 'success', durationMs),
    info: (message: string, durationMs?: number) => push(message, 'info', durationMs),
    danger: (message: string, durationMs?: number) => push(message, 'danger', durationMs),
    dismiss: dismissToast,
  };
}
