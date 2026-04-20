import type { CatalogProductImport } from '~/types';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function nullableNumber(x: unknown, path: string, errors: string[]): void {
  if (x === null) return;
  if (!isFiniteNumber(x)) errors.push(`${path}: expected number or null`);
}

function expectString(x: unknown, path: string, errors: string[]): void {
  if (typeof x !== 'string') errors.push(`${path}: expected string`);
}

function expectBoolean(x: unknown, path: string, errors: string[]): void {
  if (typeof x !== 'boolean') errors.push(`${path}: expected boolean`);
}

function validatePriceGroup(x: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(x)) {
    return [`${path}: expected object`];
  }
  if (!isFiniteNumber(x.class)) errors.push(`${path}.class: expected number`);
  if (!isFiniteNumber(x.price)) errors.push(`${path}.price: expected number`);
  return errors;
}

function validateWidthEntry(x: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(x)) {
    return [`${path}: expected object`];
  }
  nullableNumber(x.value, `${path}.value`, errors);
  expectString(x.code, `${path}.code`, errors);
  nullableNumber(x.min, `${path}.min`, errors);
  nullableNumber(x.max, `${path}.max`, errors);
  expectBoolean(x.LR, `${path}.LR`, errors);
  if (!Array.isArray(x.priceGroups)) {
    errors.push(`${path}.priceGroups: expected array`);
  } else {
    x.priceGroups.forEach((pg, i) => {
      errors.push(...validatePriceGroup(pg, `${path}.priceGroups[${i}]`));
    });
  }
  return errors;
}

function validateDepthOption(x: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(x)) {
    return [`${path}: expected object`];
  }
  expectString(x.name, `${path}.name`, errors);
  if (!isFiniteNumber(x.value)) errors.push(`${path}.value: expected number`);
  return errors;
}

function validateSurcharge(x: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(x)) {
    return [`${path}: expected object`];
  }
  expectString(x.name, `${path}.name`, errors);
  expectString(x.code, `${path}.code`, errors);
  if (!Array.isArray(x.priceGroups)) {
    errors.push(`${path}.priceGroups: expected array`);
  } else {
    x.priceGroups.forEach((pg, i) => {
      errors.push(...validatePriceGroup(pg, `${path}.priceGroups[${i}]`));
    });
  }
  return errors;
}

function validateProductGroup(x: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(x)) {
    return [`${path}: expected object`];
  }
  expectString(x.name, `${path}.name`, errors);
  expectString(x.image, `${path}.image`, errors);
  expectString(x.description, `${path}.description`, errors);
  if (!Array.isArray(x.width)) {
    errors.push(`${path}.width: expected array`);
  } else {
    x.width.forEach((w, i) => {
      errors.push(...validateWidthEntry(w, `${path}.width[${i}]`));
    });
  }
  if (!Array.isArray(x.depthOptions)) {
    errors.push(`${path}.depthOptions: expected array`);
  } else {
    x.depthOptions.forEach((d, i) => {
      errors.push(...validateDepthOption(d, `${path}.depthOptions[${i}]`));
    });
  }
  if (!Array.isArray(x.surcharges)) {
    errors.push(`${path}.surcharges: expected array`);
  } else {
    x.surcharges.forEach((s, i) => {
      errors.push(...validateSurcharge(s, `${path}.surcharges[${i}]`));
    });
  }
  return errors;
}

export type ParseJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/** Parse JSON text; returns a friendly error message on failure. */
export function parseCatalogImportJson(text: string): ParseJsonResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: 'JSON is empty.' };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Invalid JSON: ${msg}` };
  }
}

export type ValidateCatalogImportResult =
  | { ok: true; data: CatalogProductImport }
  | { ok: false; errors: string[] };

/** Structural validation for `CatalogProductImport` (array of product groups). */
export function validateCatalogProductImport(value: unknown): ValidateCatalogImportResult {
  if (!Array.isArray(value)) {
    return { ok: false, errors: ['Root value must be a JSON array.'] };
  }
  const errors: string[] = [];
  value.forEach((item, i) => {
    errors.push(...validateProductGroup(item, `[${i}]`));
  });
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: value as CatalogProductImport };
}

export type CatalogImportPipelineResult =
  | { status: 'ok'; data: CatalogProductImport }
  | { status: 'parse-error'; message: string }
  | { status: 'invalid'; errors: string[] };

/** Parse JSON, then validate against the catalog import shape. */
export function parseAndValidateCatalogImport(text: string): CatalogImportPipelineResult {
  const parsed = parseCatalogImportJson(text);
  if (!parsed.ok) {
    return { status: 'parse-error', message: parsed.error };
  }
  const v = validateCatalogProductImport(parsed.value);
  if (!v.ok) {
    return { status: 'invalid', errors: v.errors };
  }
  return { status: 'ok', data: v.data };
}
