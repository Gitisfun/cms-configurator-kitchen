/** Normalize Strapi list fields that may be `T[]` or `{ data: T[] }`. */
export function strapiRelationList<T>(raw: T[] | { data: T[] } | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null && 'data' in raw && Array.isArray((raw as { data: T[] }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}
