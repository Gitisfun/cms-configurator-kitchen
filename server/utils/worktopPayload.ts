/**
 * Build Strapi `data` for worktop create/update. `name` is required; other fields optional.
 */
export function buildWorktopData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' });
  }

  const data: Record<string, unknown> = { name };

  if ('code' in b) {
    const c = b.code;
    if (c === null || c === undefined || c === '') {
      data.code = null;
    } else if (typeof c === 'string') {
      data.code = c.trim() === '' ? null : c.trim();
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid code' });
    }
  }

  if ('note' in b) {
    const n = b.note;
    if (n === null || n === undefined || n === '') {
      data.note = null;
    } else if (typeof n === 'string') {
      data.note = n.trim() === '' ? null : n.trim();
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid note' });
    }
  }

  if ('description' in b) {
    const d = b.description;
    if (d === null || d === undefined || d === '') {
      data.description = null;
    } else if (typeof d === 'string') {
      data.description = d.trim() === '' ? null : d.trim();
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid description' });
    }
  }

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
