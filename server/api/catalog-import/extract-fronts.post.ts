import { Buffer } from 'node:buffer';
import { readMultipartFormData } from 'h3';
import JSZip from 'jszip';

/**
 * BFF: forwards catalog PDF to Python `/extract/fronts` (multipart `file`),
 * then unpacks the ZIP (`fronts.json` + `fronts/*.png`) into a JSON list with data URLs for images.
 */
const DEFAULT_FRONTS = 'http://localhost:5001/extract/fronts';

function resolveFrontsExtractUrl(): string {
  const explicit = process.env.PDF_EXTRACT_FRONTS_URL?.trim();
  if (explicit) return explicit;
  const cabinet = process.env.PDF_EXTRACT_API_URL?.trim();
  if (cabinet) {
    try {
      const u = new URL(cabinet);
      u.pathname = '/extract/fronts';
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_FRONTS;
}

type FrontJsonRow = {
  code: string;
  name: string;
  image: string;
  priceClass: string | number;
};

function normalizePriceClass(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') return v;
  return String(v ?? '');
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

  const url = resolveFrontsExtractUrl();
  const outbound = new FormData();
  const uploadBlob = new Blob([new Uint8Array(buf)], { type: 'application/pdf' });
  outbound.append('file', uploadBlob, filePart.filename || 'upload.pdf');

  let zipBytes: Uint8Array;
  try {
    const res = await fetch(url, { method: 'POST', body: outbound });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Fronts extractor failed (${res.status})`);
    }
    zipBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not call fronts extractor (${url}): ${msg}`,
    });
  }

  let frontsRaw: unknown;
  const warnings: string[] = [];
  try {
    const zip = await JSZip.loadAsync(Buffer.from(zipBytes));
    const files = Object.keys(zip.files);
    const jsonPath = files.find((p) => /(^|\/)fronts\.json$/i.test(p) && !zip.files[p]?.dir);
    if (!jsonPath) {
      throw new Error('ZIP does not contain fronts.json');
    }
    const frontsJsonStr = await zip.file(jsonPath)!.async('string');
    frontsRaw = JSON.parse(frontsJsonStr);

    const imagePaths = files.filter((p) => p.startsWith('fronts/') && !zip.files[p]?.dir);
    const imageDataUrls = new Map<string, string>();
    for (const p of imagePaths) {
      const entry = zip.file(p);
      if (!entry) continue;
      const base64 = await entry.async('base64');
      imageDataUrls.set(p, `data:image/png;base64,${base64}`);
    }

    if (!Array.isArray(frontsRaw)) {
      throw new Error('fronts.json must be a JSON array.');
    }

    const data = (frontsRaw as FrontJsonRow[]).map((row) => {
      const imagePath = typeof row.image === 'string' ? row.image : '';
      const dataUrl = imagePath ? imageDataUrls.get(imagePath) : undefined;
      if (imagePath && !dataUrl) {
        warnings.push(`Missing image in ZIP for path: ${imagePath}`);
      }
      return {
        code: typeof row.code === 'string' ? row.code : String(row.code ?? ''),
        name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
        image: dataUrl ?? imagePath,
        priceClass: normalizePriceClass(row.priceClass),
      };
    });

    if (data.length === 0 && imagePaths.length > 0) {
      warnings.push('ZIP contained front images but fronts.json was empty.');
    }

    return { ok: true as const, data, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 422,
      statusMessage: `Could not read fronts extractor ZIP: ${msg}`,
      data: { warnings },
    });
  }
});
