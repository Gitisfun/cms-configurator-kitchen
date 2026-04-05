/**
 * Build Strapi `data` for handle create/update. `name` is required; other fields optional.
 */
export function buildHandleData(body: unknown): Record<string, unknown> {
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
    if (c === null || c === undefined || c === '') {
      data.color = null;
    } else if (typeof c === 'string') {
      const t = c.trim();
      data.color = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid color' });
    }
  }

  if ('hasHold' in b) {
    const h = b.hasHold;
    if (h === true || h === false) {
      data.hasHold = h;
    } else if (h === 'true' || h === 1 || h === '1') {
      data.hasHold = true;
    } else if (h === 'false' || h === 0 || h === '0') {
      data.hasHold = false;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid hasHold' });
    }
  }

  if ('position' in b) {
    const p = b.position;
    if (p === null || p === '') {
      data.position = 0;
    } else if (typeof p === 'number' && Number.isFinite(p)) {
      if (!Number.isInteger(p)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid position' });
      }
      data.position = p;
    } else if (typeof p === 'string') {
      const t = p.trim();
      if (t === '') {
        data.position = 0;
      } else {
        const n = Number(t);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid position' });
        }
        data.position = n;
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid position' });
    }
  }

  if ('handlePositionId' in b) {
    const hp = b.handlePositionId;
    if (hp === null) {
      data.handlePosition = null;
    } else if (typeof hp === 'number' && Number.isFinite(hp)) {
      data.handlePosition = hp;
    } else if (typeof hp === 'string' && hp.trim() !== '') {
      const n = Number(hp.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid handlePositionId' });
      }
      data.handlePosition = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid handlePositionId' });
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
