import { createError } from 'h3';

export interface ParsedSurchargeLinkPrice {
  priceClassId: number;
  price: number;
}

export interface ParsedCreateSurchargeLink {
  cabinetTypeId: number;
  surchargeId: number;
  prices: ParsedSurchargeLinkPrice[];
}

export interface ParsedUpdateSurchargeLink {
  prices: ParsedSurchargeLinkPrice[];
}

function parsePositiveInt(raw: unknown, fieldName: string): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldName}` });
  }
  return n;
}

function parseDecimal(raw: unknown, fieldName: string): number {
  if (raw === null || raw === undefined || raw === '') {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} is required` });
  }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldName}` });
  }
  return n;
}

function parsePrices(raw: unknown): ParsedSurchargeLinkPrice[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid prices' });
  }
  const seen = new Set<number>();
  const result: ParsedSurchargeLinkPrice[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid price row' });
    }
    const obj = entry as Record<string, unknown>;
    const priceClassId = parsePositiveInt(obj.priceClassId, 'priceClassId');
    if (seen.has(priceClassId)) {
      throw createError({ statusCode: 400, statusMessage: 'Duplicate priceClassId in prices' });
    }
    seen.add(priceClassId);
    const price = parseDecimal(obj.price, 'price');
    result.push({ priceClassId, price });
  }
  return result;
}

export function parseCreateSurchargeLink(body: unknown): ParsedCreateSurchargeLink {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }
  const b = body as Record<string, unknown>;
  return {
    cabinetTypeId: parsePositiveInt(b.cabinetTypeId, 'cabinetTypeId'),
    surchargeId: parsePositiveInt(b.surchargeId, 'surchargeId'),
    prices: parsePrices(b.prices),
  };
}

export function parseUpdateSurchargeLink(body: unknown): ParsedUpdateSurchargeLink {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }
  const b = body as Record<string, unknown>;
  return {
    prices: parsePrices(b.prices),
  };
}
