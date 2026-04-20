export function strapiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: { message?: string } } }).data;
    const msg = data?.error?.message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export function strapiErrorStatus(err: unknown): number {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const s = Number((err as { statusCode: number }).statusCode);
    if (s >= 400 && s < 600) return s;
  }
  return 502;
}
