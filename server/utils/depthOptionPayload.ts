const MAX_NAME_LEN = 255;

function parseDocumentIdArray(key: string, b: Record<string, unknown>): string[] {
  const v = b[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${key}` });
  }
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === 'string' && item.trim() !== '') out.push(item.trim());
  }
  return out;
}

function cabinetTypesConnectDisconnect(connectIds: string[], disconnectIds: string[]): Record<string, unknown> | null {
  if (!connectIds.length && !disconnectIds.length) return null;
  const ct: Record<string, unknown> = {};
  if (connectIds.length) ct.connect = connectIds;
  if (disconnectIds.length) ct.disconnect = disconnectIds;
  return { cabinetTypes: ct };
}

export function buildDepthOptionData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const connectIds = parseDocumentIdArray('connectCabinetTypeDocumentIds', b);
  const disconnectIds = parseDocumentIdArray('disconnectCabinetTypeDocumentIds', b);

  const hasScalars =
    'name' in b ||
    'depth' in b ||
    'surchargeCode' in b ||
    'surchargeAmount' in b ||
    'isDefault' in b;

  if (!hasScalars) {
    const rel = cabinetTypesConnectDisconnect(connectIds, disconnectIds);
    if (!rel) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
    }
    return rel;
  }

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

  const rel = cabinetTypesConnectDisconnect(connectIds, disconnectIds);
  if (rel) Object.assign(data, rel);

  return data;
}
