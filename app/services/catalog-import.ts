import type { CatalogProductGroup } from '../types/catalog-product-import';

export const catalogImportProductPath = '/api/catalog-import/product' as const;

export interface CatalogProductImportResult {
  cabinetType: { id: number; documentId: string };
  variants: { orderNumber: string; documentId: string }[];
  variantCount: number;
  cabinetPricesCreated: number;
  skippedPricesMissingPriceClass?: number;
  depthOptions: { name: string; action: 'linked' | 'created'; documentId: string }[];
  surcharges: { name: string; action: 'linked' | 'created'; surchargeId: number }[];
}

export function importCatalogProduct(body: {
  cabinetSeriesDocumentId: string;
  product: CatalogProductGroup;
  imageId?: number | null;
}) {
  return $fetch<CatalogProductImportResult>(catalogImportProductPath, {
    method: 'POST',
    body,
  });
}
