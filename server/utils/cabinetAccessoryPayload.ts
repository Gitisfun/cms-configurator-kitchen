const MAX_NAME_LEN = 255;
const MAX_DESCRIPTION_LEN = 10_000;

export function buildCabinetAccessoryData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' });
  }
  if (name.length > MAX_NAME_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Name must be at most ${MAX_NAME_LEN} characters` });
  }

  const data: Record<string, unknown> = { name };

  if ('description' in b) {
    const desc = b.description;
    if (desc === null || desc === undefined) {
      data.description = null;
    } else if (typeof desc === 'string') {
      const t = desc.trim();
      if (t.length > MAX_DESCRIPTION_LEN) {
        throw createError({ statusCode: 400, statusMessage: `Description must be at most ${MAX_DESCRIPTION_LEN} characters` });
      }
      data.description = t || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid description' });
    }
  }

  if ('price' in b) {
    const p = b.price;
    if (p === null || p === '') {
      throw createError({ statusCode: 400, statusMessage: 'Price is required' });
    } else if (typeof p === 'number' && Number.isFinite(p)) {
      data.price = p;
    } else if (typeof p === 'string') {
      const t = p.trim();
      if (t === '') {
        throw createError({ statusCode: 400, statusMessage: 'Price is required' });
      }
      const n = Number(t);
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid price' });
      }
      data.price = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid price' });
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

  return data;
}
