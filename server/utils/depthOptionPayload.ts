const MAX_NAME_LEN = 255;

export function buildDepthOptionData(body: unknown): Record<string, unknown> {
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

  if ('depth' in b) {
    const v = b.depth;
    if (v === null || v === '' || v === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Depth is required' });
    }
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid depth' });
    }
    data.depth = n;
  }

  if ('surchargeCode' in b) {
    const v = b.surchargeCode;
    if (v === null || v === undefined || v === '') {
      data.surchargeCode = null;
    } else if (typeof v === 'string') {
      data.surchargeCode = v.trim() || null;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid surcharge code' });
    }
  }

  if ('surchargeAmount' in b) {
    const v = b.surchargeAmount;
    if (v === null || v === '') {
      data.surchargeAmount = 0;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      data.surchargeAmount = v;
    } else if (typeof v === 'string') {
      const t = v.trim();
      if (t === '') {
        data.surchargeAmount = 0;
      } else {
        const n = Number(t);
        if (!Number.isFinite(n)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid surcharge amount' });
        }
        data.surchargeAmount = n;
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid surcharge amount' });
    }
  }

  if ('isDefault' in b) {
    const v = b.isDefault;
    if (v === true || v === false) {
      data.isDefault = v;
    } else if (v === 'true' || v === 1 || v === '1') {
      data.isDefault = true;
    } else if (v === 'false' || v === 0 || v === '0') {
      data.isDefault = false;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid isDefault' });
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
