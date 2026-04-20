/**
 * Price for a single price class (0–8) on an import row or surcharge line.
 */
export interface CatalogPriceGroup {
  class: number;
  price: number;
}

/**
 * One width / order-code variant with its own L/R flag and per–price-class prices.
 */
export interface CatalogWidthEntry {
  value: number | null;
  code: string;
  min: number | null;
  max: number | null;
  LR: boolean;
  priceGroups: CatalogPriceGroup[];
}

/**
 * Optional carcase depth line from the price sheet (e.g. `.KT2=carcase depth 345 mm`).
 */
export interface CatalogDepthOption {
  name: string;
  value: number;
}

/**
 * Surcharge line (e.g. depth 680 mm) with per–price-class amounts.
 */
export interface CatalogSurcharge {
  name: string;
  code: string;
  priceGroups: CatalogPriceGroup[];
}

/**
 * One product group: shared description and image; multiple width rows each with own prices.
 * Matches the consolidated JSON shape from manual / spreadsheet imports.
 */
export interface CatalogProductGroup {
  name: string;
  image: string;
  description: string;
  width: CatalogWidthEntry[];
  depthOptions: CatalogDepthOption[];
  surcharges: CatalogSurcharge[];
}

/** Array of product groups as produced by the import pipeline. */
export type CatalogProductImport = CatalogProductGroup[];
