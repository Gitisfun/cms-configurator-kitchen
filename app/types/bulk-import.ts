export type ExtractedFrontRow = {
  code: string;
  name: string;
  image: string;
  priceClass: string;
};

export type ExtractedBackRow = {
  code: string;
  name: string;
  image: string;
};

export type ExtractedWorktopRow = {
  image: string;
  code: string;
  note: string;
  name: string;
  description: string;
  /** Optional surcharge for Strapi price; set in preview editor. */
  price: string;
};

export type ExtractedPlinthRow = {
  code: string;
  name: string;
  image: string;
  description: string;
  /** From extractor: standard catalog vs surcharge chapter. */
  hasSurcharge: boolean;
};

/** Matches extractor typo `handlePostions` in handles.json / ZIP. */
export type ExtractedHandleRow = {
  image: string;
  code: string;
  name: string;
  handlePostions: string;
  height: string;
  surcharge: string;
  type: string;
  subtype: string;
  description: string;
};

export type ExtractedHandlePositionRow = {
  name: string;
  image: string;
};

export type HandlesExtractPayload = {
  handles: ExtractedHandleRow[];
  handlePositions: ExtractedHandlePositionRow[];
};

export type ExtractedCabinetSeries = {
  name: string;
  carcaseHeight: number | null;
  defaultCarcaseDepth: number | null;
};

export type ExtractedCabinetSeriesSection = ExtractedCabinetSeries & {
  productIndexes: number[];
};

export type CatalogPdfExtractedImage =
  | {
      source: 'embedded';
      page: number;
      index: number;
      width: number;
      height: number;
      kind: number;
      filter?: string;
      colorSpace?: string;
      mimeType: string;
      dataUrl: string;
    }
  | {
      source: 'page-render';
      page: number;
      scale: number;
      mimeType: 'image/png';
      dataUrl: string;
    }
  | {
      source: 'row-crop';
      page: number;
      groupIndex: number;
      mimeType: 'image/png' | 'image/svg+xml';
      dataUrl: string;
    };
