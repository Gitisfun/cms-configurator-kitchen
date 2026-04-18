const MAX_NAME_LEN = 255;
const MAX_CODE_LEN = 255;

export function buildCabinetTypeSurchargeData(body: unknown): Record<string, unknown> {
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

  const code = typeof b.code === 'string' ? b.code.trim() : '';
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Code is required' });
  }
  if (code.length > MAX_CODE_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Code must be at most ${MAX_CODE_LEN} characters` });
  }

  const data: Record<string, unknown> = { name, code };

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

  if ('cabinetTypeId' in b) {
    const v = b.cabinetTypeId;
    if (v === null || v === undefined || v === '') {
      throw createError({ statusCode: 400, statusMessage: 'Cabinet type is required' });
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
