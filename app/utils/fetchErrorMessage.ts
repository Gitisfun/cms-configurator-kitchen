/**
 * Human-readable message from $fetch / ofetch errors (Nuxt client & server).
 */
export function getFetchErrorMessage(error: unknown, fallback: string): string {
  if (error == null || typeof error !== 'object') return fallback;
  const e = error as {
    data?: { statusMessage?: string; message?: string };
    statusMessage?: string;
    message?: string;
  };
  return (
    e.data?.statusMessage
    || e.data?.message
    || e.statusMessage
    || e.message
    || fallback
  );
}
