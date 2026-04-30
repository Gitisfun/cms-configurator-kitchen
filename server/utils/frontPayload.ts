const MAX_NAME_LEN = 255;
const MAX_CODE_LEN = 255;
const MAX_DESCRIPTION_LEN = 10_000;

/**
 * Build Strapi `data` for front create/update. `name` is required.
 * Optional: `description`, `imageId` → `image`, `priceClassId` → `priceClass`.
 */
export function buildFrontData(body: unknown): Record<string, unknown> {
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

  const data: Record<string, unknown> = { name };

  if ('code' in b) {
    const c = b.code;
    if (c === null || c === undefined || c === '') {
      data.code = null;
    } else if (typeof c === 'string') {
      const t = c.trim();
      if (t.length > MAX_CODE_LEN) {
        throw createError({
          statusCode: 400,
          statusMessage: `Code must be at most ${MAX_CODE_LEN} characters`,
        });
      }
      data.code = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid code' });
    }
  }

  if ('description' in b) {
    const desc = b.description;
    if (desc === null || desc === undefined) {
      data.description = null;
    } else if (typeof desc === 'string') {
      const t = desc.trim();
      if (t.length > MAX_DESCRIPTION_LEN) {
        throw createError({
          statusCode: 400,
          statusMessage: `Description must be at most ${MAX_DESCRIPTION_LEN} characters`,
        });
      }
      data.description = t || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid description' });
    }
  }

  if ('imageId' in b) {
    const img = b.imageId;
    if (img === null) {
      data.image = null;
    } else if (typeof img === 'number' && Number.isFinite(img)) {
      data.image = img;
    } else if (typeof img === 'string' && img.trim() !== '') {
      const n = Number(img.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid imageId' });
      }
      data.image = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid imageId' });
    }
  }

  if ('priceClassId' in b) {
    const pc = b.priceClassId;
    if (pc === null) {
      data.priceClass = null;
    } else if (typeof pc === 'number' && Number.isFinite(pc)) {
      data.priceClass = pc;
    } else if (typeof pc === 'string' && pc.trim() !== '') {
      const n = Number(pc.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid priceClassId' });
      }
      data.priceClass = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid priceClassId' });
    }
  }

  return data;
}
