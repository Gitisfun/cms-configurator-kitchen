class Format {
  static dateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  static priceEur(value: number | string | null | ''): string {
    if (value == null || value === '') return '—';
    const n = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(n)) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
}

export default Format;
