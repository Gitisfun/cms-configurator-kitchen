const MAX_NAME_LEN = 255;
const MAX_CODE_LEN = 255;

const DIMENSIONS = new Set(['height', 'width', 'depth']);

function parseDimension(raw: unknown): 'height' | 'width' | 'depth' | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw === 'height' || raw === 'width' || raw === 'depth') return raw;
  if (typeof raw === 'string') {
    const t = raw.trim().toLowerCase();
    if (t === '') return null;
    if (DIMENSIONS.has(t)) return t as 'height' | 'width' | 'depth';
  }
  throw createError({ statusCode: 400, statusMessage: 'Invalid dimension' });
}

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

  if ('dimension' in b) {
    data.dimension = parseDimension(b.dimension);
  }

  if ('value' in b) {
    const p = b.value;
    if (p === null || p === undefined || p === '') {
      data.value = null;
    } else if (typeof p === 'number' && Number.isFinite(p)) {
      data.value = p;
    } else if (typeof p === 'string') {
      const t = p.trim();
      if (t === '') {
        data.value = null;
      } else {
        const n = Number(t);
        if (!Number.isFinite(n)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid value' });
        }
        data.value = n;
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid value' });
    }
  }

  return data;
}
