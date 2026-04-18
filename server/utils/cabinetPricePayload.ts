export function buildCabinetPriceData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

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
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Price is required' });
  }

  if ('cabinetVariantId' in b) {
    const v = b.cabinetVariantId;
    if (v === null) {
      data.cabinetVariant = null;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.cabinetVariant = v;
    } else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetVariantId' });
      }
      data.cabinetVariant = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetVariantId' });
    }
  }

  if ('priceClassId' in b) {
    const v = b.priceClassId;
    if (v === null) {
      data.priceClass = null;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.priceClass = v;
    } else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim());
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
