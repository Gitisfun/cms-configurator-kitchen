const MAX_NAME_LEN = 255;
const MAX_CODE_LEN = 255;
const VALID_PRODUCT_LINES = ['standard', 'cLine', 'xLine'];

export function buildCabinetSeriesData(body: unknown): Record<string, unknown> {
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

  if ('carcaseHeight' in b) {
    const v = b.carcaseHeight;
    if (v === null || v === '' || v === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Carcase height is required' });
    }
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid carcase height' });
    }
    data.carcaseHeight = n;
  }

  if ('defaultCarcaseDepth' in b) {
    const v = b.defaultCarcaseDepth;
    if (v === null || v === '' || v === undefined) {
      data.defaultCarcaseDepth = 560;
    } else {
      const n = typeof v === 'number' ? v : Number(String(v).trim());
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid default carcase depth' });
      }
      data.defaultCarcaseDepth = n;
    }
  }

  if ('productLine' in b) {
    const v = b.productLine;
    if (v === null || v === '' || v === undefined) {
      data.productLine = null;
    } else if (typeof v === 'string' && VALID_PRODUCT_LINES.includes(v)) {
      data.productLine = v;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid product line' });
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

  return data;
}
