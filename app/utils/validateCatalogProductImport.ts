import type { CatalogPriceGroup, CatalogProductGroup, CatalogProductImport } from '~/types';

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

/**
 * Accepts:
 * - `[10, 20, …]` — one price per column; `class` becomes the index (0, 1, …)
 * - `[{ price: 10 }, …]` — optional `class`; if omitted, index is used as class
 * - `[{ class: 0, price: 10 }, …]` — explicit class per row
 */
function parsePriceGroups(raw: unknown, path: string): { ok: true; groups: CatalogPriceGroup[] } | { ok: false; errors: string[] } {
  if (!Array.isArray(raw)) {
    return { ok: false, errors: [`${path}: expected array`] };
  }
  if (raw.length === 0) {
    return { ok: true, groups: [] };
  }

  if (raw.every((x) => typeof x === 'number' && Number.isFinite(x))) {
    return {
      ok: true,
      groups: raw.map((price, i) => ({ class: i, price: price as number })),
    };
  }

  const groups: CatalogPriceGroup[] = [];
  const errors: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const p = `${path}[${i}]`;
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      if ('price' in o && isFiniteNumber(o.price)) {
        const pr = o.price;
        if ('class' in o && o.class !== null && o.class !== undefined) {
          if (!isFiniteNumber(o.class)) {
            errors.push(`${p}.class: expected number`);
            continue;
          }
          groups.push({ class: o.class as number, price: pr });
        } else {
          groups.push({ class: i, price: pr });
        }
        continue;
      }
    }
    errors.push(`${p}: expected a finite number or an object { class?: number, price: number }`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, groups };
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
  const pg = parsePriceGroups(x.priceGroups, `${path}.priceGroups`);
  if (!pg.ok) errors.push(...pg.errors);
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
  const pg = parsePriceGroups(x.priceGroups, `${path}.priceGroups`);
  if (!pg.ok) errors.push(...pg.errors);
  return errors;
}

/** Replace numeric-only / implicit-class shapes with `{ class, price }[]` for the importer. */
function normalizeProductGroup(g: CatalogProductGroup): CatalogProductGroup {
  return {
    ...g,
    width: g.width.map((w) => {
      const r = parsePriceGroups(w.priceGroups as unknown, 'width.priceGroups');
      return { ...w, priceGroups: r.ok ? r.groups : w.priceGroups };
    }),
    surcharges: g.surcharges.map((s) => {
      const r = parsePriceGroups(s.priceGroups as unknown, 'surcharges.priceGroups');
      return { ...s, priceGroups: r.ok ? r.groups : s.priceGroups };
    }),
  };
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
  const raw = value as CatalogProductImport;
  return { ok: true, data: raw.map(normalizeProductGroup) };
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
