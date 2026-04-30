import { validateCatalogProductImport } from '../../../app/utils/validateCatalogProductImport';
import type { CatalogProductGroup } from '../../../app/types/catalog-product-import';

/**
 * Proxies the validated payload to Strapi's transactional
 * `/api/catalog-import/product` endpoint. The heavy lifting
 * (cabinet type + variants + prices + depth options + surcharge
 * links/prices) runs inside a single DB transaction server-side,
 * so any failure rolls back the whole import.
 */

function strapiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: { message?: string } } }).data;
    const msg = data?.error?.message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

function strapiErrorStatus(err: unknown): number {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const n = Number((err as { statusCode: number }).statusCode);
    if (Number.isFinite(n) && n >= 400 && n < 600) return n;
  }
  return 502;
}

export default defineEventHandler(async (event): Promise<unknown> => {
  const config = useRuntimeConfig();
  const raw = await readBody(event).catch(() => null);
  if (!raw || typeof raw !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = raw as Record<string, unknown>;
  const cabinetSeriesDocumentId =
    typeof b.cabinetSeriesDocumentId === 'string' ? b.cabinetSeriesDocumentId.trim() : '';
  if (!cabinetSeriesDocumentId) {
    throw createError({ statusCode: 400, statusMessage: 'cabinetSeriesDocumentId is required' });
  }

  const product = b.product;
  if (product === undefined || product === null) {
    throw createError({ statusCode: 400, statusMessage: 'product is required' });
  }
  const v = validateCatalogProductImport([product]);
  if (!v.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: v.errors.length ? v.errors.join('; ') : 'Invalid product payload',
    });
  }
  const normalizedProduct = v.data[0] as CatalogProductGroup;

  let imageId: number | null | undefined;
  if ('imageId' in b) {
    const img = b.imageId;
    if (img === null || img === undefined) {
      imageId = null;
    } else if (typeof img === 'number' && Number.isFinite(img)) {
      imageId = img;
    } else if (typeof img === 'string' && img.trim() !== '') {
      const n = Number(img.trim());
      imageId = Number.isFinite(n) ? n : undefined;
    }
  }

  const body: Record<string, unknown> = {
    cabinetSeriesDocumentId,
    product: normalizedProduct,
  };
  if (imageId !== undefined) body.imageId = imageId;

  try {
    return await $fetch(`${config.strapiUrl}/api/catalog-import/product`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.strapiToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (err: unknown) {
    throw createError({
      statusCode: strapiErrorStatus(err),
      statusMessage: strapiErrorMessage(err),
    });
  }
});
