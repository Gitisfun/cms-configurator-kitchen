/**
 * Build Strapi `data` for plinth create/update. `name` is required; `price` and `color` optional.
 */
export function buildPlinthData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' });
  }

  const data: Record<string, unknown> = { name };

  if ('price' in b) {
    const p = b.price;
    if (p === null || p === '') {
      data.price = null;
    } else if (typeof p === 'number' && Number.isFinite(p)) {
      data.price = p;
    } else if (typeof p === 'string') {
      const t = p.trim();
      if (t === '') {
        data.price = null;
      } else {
        const n = Number(t);
        if (Number.isNaN(n)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid price' });
        }
        data.price = n;
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid price' });
    }
  }

  if ('color' in b) {
    const c = b.color;
    if (c === null || c === undefined) {
      data.color = null;
    } else if (typeof c === 'string') {
      data.color = c.trim() || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid color' });
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
