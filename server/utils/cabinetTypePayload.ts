const MAX_NAME_LEN = 255;
const MAX_DESCRIPTION_LEN = 10_000;

export function buildCabinetTypeData(body: unknown): Record<string, unknown> {
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

  if ('orderNumberPrefix' in b) {
    const v = b.orderNumberPrefix;
    if (v === null || v === undefined || v === '') {
      data.orderNumberPrefix = null;
    } else if (typeof v === 'string') {
      data.orderNumberPrefix = v.trim() || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid orderNumberPrefix' });
    }
  }

  if ('depthSurchargeCode' in b) {
    const v = b.depthSurchargeCode;
    if (v === null || v === undefined || v === '') {
      data.depthSurchargeCode = null;
    } else if (typeof v === 'string') {
      data.depthSurchargeCode = v.trim() || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid depthSurchargeCode' });
    }
  }

  for (const field of ['hasLeftRight', 'hasInternalPanel'] as const) {
    if (field in b) {
      const v = b[field];
      if (v === true || v === false) {
        data[field] = v;
      } else if (v === 'true' || v === 1 || v === '1') {
        data[field] = true;
      } else if (v === 'false' || v === 0 || v === '0') {
        data[field] = false;
      } else {
        throw createError({ statusCode: 400, statusMessage: `Invalid ${field}` });
      }
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

  if ('subcategoryId' in b) {
    const v = b.subcategoryId;
    if (v === null) {
      data.subcategory = null;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.subcategory = v;
    } else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid subcategoryId' });
      }
      data.subcategory = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid subcategoryId' });
    }
  }

  if ('cabinetSeriesId' in b) {
    const v = b.cabinetSeriesId;
    if (v === null) {
      data.cabinetSeries = null;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.cabinetSeries = v;
    } else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetSeriesId' });
      }
      data.cabinetSeries = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetSeriesId' });
    }
  }

  return data;
}
