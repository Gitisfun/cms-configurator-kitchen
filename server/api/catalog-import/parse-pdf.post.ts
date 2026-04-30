import { Buffer } from 'node:buffer';
import { readMultipartFormData } from 'h3';
import JSZip from 'jszip';
import { validateCatalogProductImport } from '../../../app/utils/validateCatalogProductImport';

const PDF_EXTRACT_API_URL = process.env.PDF_EXTRACT_API_URL || 'http://localhost:5001/extract';

type ExternalZipProduct = {
  image?: string;
  [key: string]: unknown;
};

type ApiRowCropImage = {
  source: 'row-crop';
  page: number;
  groupIndex: number;
  mimeType: 'image/png' | 'image/svg+xml';
  dataUrl: string;
};

function mimeFromPath(path: string): 'image/png' | 'image/svg+xml' {
  const p = path.toLowerCase();
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((p) => p.name === 'file' && p.data && p.filename);
  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Multipart field "file" with a PDF is required.' });
  }

  const raw = filePart.data;
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

  const outbound = new FormData();
  const uploadBlob = new Blob([new Uint8Array(buf)], { type: 'application/pdf' });
  outbound.append('file', uploadBlob, filePart.filename || 'upload.pdf');

  let zipBytes: Uint8Array;
  try {
    const res = await fetch(PDF_EXTRACT_API_URL, {
      method: 'POST',
      body: outbound,
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `External extractor failed (${res.status})`);
    }
    zipBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not call PDF extractor API (${PDF_EXTRACT_API_URL}): ${msg}`,
    });
  }

  let productsRaw: unknown;
  const images: ApiRowCropImage[] = [];
  let warnings: string[] = [];
  try {
    const zip = await JSZip.loadAsync(Buffer.from(zipBytes));
    const files = Object.keys(zip.files);
    const productsPath = files.find((p) => /(^|\/)products\.json$/i.test(p) && !zip.files[p]?.dir);
    if (!productsPath) {
      throw new Error('ZIP does not contain products.json');
    }
    const productsText = await zip.file(productsPath)!.async('string');
    productsRaw = JSON.parse(productsText);

    const imagePaths = files.filter((p) => p.startsWith('images/') && !zip.files[p]?.dir);
    const allImageDataUrls = new Map<string, { mimeType: 'image/png' | 'image/svg+xml'; dataUrl: string }>();
    for (const p of imagePaths) {
      const entry = zip.file(p);
      if (!entry) continue;
      const mimeType = mimeFromPath(p);
      const base64 = await entry.async('base64');
      allImageDataUrls.set(p, {
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
    }

    const productList = Array.isArray(productsRaw) ? productsRaw : [];
    for (let i = 0; i < productList.length; i += 1) {
      const product = productList[i] as ExternalZipProduct;
      const imagePath = typeof product.image === 'string' ? product.image : '';
      const img = allImageDataUrls.get(imagePath);
      if (!img) continue;
      images.push({
        source: 'row-crop',
        page: 1,
        groupIndex: i,
        mimeType: img.mimeType,
        dataUrl: img.dataUrl,
      });
    }

    if (images.length === 0 && imagePaths.length > 0) {
      warnings = ['ZIP contained images but none matched product.image paths.'];
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 422,
      statusMessage: `Could not read extractor ZIP response: ${msg}`,
    });
  }

  const v = validateCatalogProductImport(productsRaw);
  if (!v.ok) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Extractor products.json did not match the catalog import schema.',
      data: { errors: v.errors, warnings },
    });
  }

  return {
    ok: true as const,
    data: v.data,
    warnings,
    images,
  };
});
