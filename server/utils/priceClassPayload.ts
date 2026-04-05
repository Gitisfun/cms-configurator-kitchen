const MAX_NAME_LEN = 255;
const MIN_LEVEL = 0;
const MAX_LEVEL = 1_000_000;

function parseLevel(raw: unknown, fieldLabel: string): number {
  if (typeof raw === 'number' && Number.isInteger(raw)) {
    if (raw < MIN_LEVEL || raw > MAX_LEVEL) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldLabel} must be between ${MIN_LEVEL} and ${MAX_LEVEL}`,
      });
    }
    return raw;
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') {
      throw createError({ statusCode: 400, statusMessage: `${fieldLabel} is required` });
    }
    const n = Number(t);
    if (!Number.isInteger(n) || n < MIN_LEVEL || n > MAX_LEVEL) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldLabel} must be a whole number between ${MIN_LEVEL} and ${MAX_LEVEL}`,
      });
    }
    return n;
  }
  throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldLabel.toLowerCase()}` });
}

/**
 * Build Strapi `data` for price-class create/update. `name` and `level` are required.
 */
export function buildPriceClassData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' });
  }
  if (name.length > MAX_NAME_LEN) {
    throw createError({
      statusCode: 400,
      statusMessage: `Name must be at most ${MAX_NAME_LEN} characters`,
    });
  }

  const level = parseLevel(b.level, 'Level');

  return { name, level };
}
