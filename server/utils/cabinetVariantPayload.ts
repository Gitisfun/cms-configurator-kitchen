const MAX_ORDER_NUMBER_LEN = 255;

export function buildCabinetVariantData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const orderNumber = typeof b.orderNumber === 'string' ? b.orderNumber.trim() : '';
  if (!orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Order number is required' });
  }
  if (orderNumber.length > MAX_ORDER_NUMBER_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Order number must be at most ${MAX_ORDER_NUMBER_LEN} characters` });
  }

  const data: Record<string, unknown> = { orderNumber };

  if ('width' in b) {
    const v = b.width;
    if (v === null || v === '' || v === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Width is required' });
    }
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid width' });
    }
    data.width = n;
  }

  if ('isVariableWidth' in b) {
    const v = b.isVariableWidth;
    if (v === true || v === false) {
      data.isVariableWidth = v;
    } else if (v === 'true' || v === 1 || v === '1') {
      data.isVariableWidth = true;
    } else if (v === 'false' || v === 0 || v === '0') {
      data.isVariableWidth = false;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid isVariableWidth' });
    }
  }

  for (const field of ['minWidth', 'maxWidth'] as const) {
    if (field in b) {
      const v = b[field];
      if (v === null || v === '' || v === undefined) {
        data[field] = null;
      } else {
        const n = typeof v === 'number' ? v : Number(String(v).trim());
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          throw createError({ statusCode: 400, statusMessage: `Invalid ${field}` });
        }
        data[field] = n;
      }
    }
  }

  if ('height' in b) {
    const v = b.height;
    if (v === null || v === '' || v === undefined) {
      data.height = null;
    } else {
      const n = typeof v === 'number' ? v : Number(String(v).trim());
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid height' });
      }
      data.height = n;
    }
  }

  if ('cabinetTypeId' in b) {
    const v = b.cabinetTypeId;
    if (v === null) {
      data.cabinetType = null;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.cabinetType = v;
    } else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetTypeId' });
      }
      data.cabinetType = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cabinetTypeId' });
    }
  }

  return data;
}
