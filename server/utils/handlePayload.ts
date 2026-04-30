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

  function optionalStringAttr(bodyKey: string, strapiKey: string) {
    if (!(bodyKey in b)) return;
    const v = b[bodyKey];
    if (v === null || v === undefined || v === '') {
      data[strapiKey] = null;
    } else if (typeof v === 'string') {
      const t = v.trim();
      data[strapiKey] = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: `Invalid ${bodyKey}` });
    }
  }

  optionalStringAttr('code', 'code');
  optionalStringAttr('handlePostions', 'handlePostions');
  optionalStringAttr('height', 'height');
  optionalStringAttr('description', 'description');

  if ('catalogType' in b) {
    optionalStringAttr('catalogType', 'catalogType');
  } else if ('type' in b) {
    const v = b.type;
    if (v === null || v === undefined || v === '') {
      data.catalogType = null;
    } else if (typeof v === 'string') {
      const t = v.trim();
      data.catalogType = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid type' });
    }
  }

  if ('catalogSubtype' in b) {
    optionalStringAttr('catalogSubtype', 'catalogSubtype');
  } else if ('subtype' in b) {
    const v = b.subtype;
    if (v === null || v === undefined || v === '') {
      data.catalogSubtype = null;
    } else if (typeof v === 'string') {
      const t = v.trim();
      data.catalogSubtype = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid subtype' });
    }
  }

  if ('surchargeDisplay' in b) {
    optionalStringAttr('surchargeDisplay', 'surchargeDisplay');
  } else if ('surcharge' in b) {
    const s = b.surcharge;
    if (s === null || s === undefined || s === '') {
      data.surchargeDisplay = null;
    } else if (typeof s === 'string') {
      const t = s.trim();
      data.surchargeDisplay = t === '' ? null : t;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid surcharge' });
    }
  }

  let positionsFromBody = false;
  if ('handlePositions' in b && typeof b.handlePositions === 'object' && b.handlePositions !== null) {
    const rel = b.handlePositions as Record<string, unknown>;
    if ('set' in rel) {
      positionsFromBody = true;
      const s = rel.set;
      if (!Array.isArray(s)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid handlePositions.set' });
      }
      const set: string[] = [];
      for (const item of s) {
        if (typeof item === 'string' && item.trim() !== '') {
          set.push(item.trim());
        }
      }
      data.handlePositions = { set };
    }
  }
  if (!positionsFromBody && 'handlePositionDocumentIds' in b) {
    const hp = b.handlePositionDocumentIds;
    if (hp === null || hp === undefined) {
      data.handlePositions = { set: [] };
    } else if (Array.isArray(hp)) {
      const set: string[] = [];
      for (const item of hp) {
        if (typeof item === 'string' && item.trim() !== '') {
          set.push(item.trim());
        }
      }
      data.handlePositions = { set };
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid handlePositionDocumentIds' });
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
