import { Buffer } from 'node:buffer';
import { readMultipartFormData } from 'h3';
import JSZip from 'jszip';

/**
 * BFF: forwards catalog PDF to Python `/extract/handles` (multipart `file`),
 * unpacks ZIP (`handles.json` + `handles/*.png` + `handlePositions/*.png`).
 */
const DEFAULT_HANDLES = 'http://localhost:5001/extract/handles';

function resolveHandlesExtractUrl(): string {
  const explicit = process.env.PDF_EXTRACT_HANDLES_URL?.trim();
  if (explicit) return explicit;
  const cabinet = process.env.PDF_EXTRACT_API_URL?.trim();
  if (cabinet) {
    try {
      const u = new URL(cabinet);
      u.pathname = '/extract/handles';
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_HANDLES;
}

type HandleJsonRow = {
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

type HandlePositionJsonRow = {
  name: string;
  image: string;
};

type HandlesPayloadJson = {
  handles?: unknown;
  handlePositions?: unknown;
};

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

  const url = resolveHandlesExtractUrl();
  const outbound = new FormData();
  const uploadBlob = new Blob([new Uint8Array(buf)], { type: 'application/pdf' });
  outbound.append('file', uploadBlob, filePart.filename || 'upload.pdf');

  let zipBytes: Uint8Array;
  try {
    const res = await fetch(url, { method: 'POST', body: outbound });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Handles extractor failed (${res.status})`);
    }
    zipBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not call handles extractor (${url}): ${msg}`,
    });
  }

  const warnings: string[] = [];
  try {
    const zip = await JSZip.loadAsync(Buffer.from(zipBytes));
    const files = Object.keys(zip.files);
    const jsonPath = files.find((p) => /(^|\/)handles\.json$/i.test(p) && !zip.files[p]?.dir);
    if (!jsonPath) {
      throw new Error('ZIP does not contain handles.json');
    }
    const rawJson = await zip.file(jsonPath)!.async('string');
    const parsed = JSON.parse(rawJson) as HandlesPayloadJson;

    const imagePaths = files.filter(
      (p) => (p.startsWith('handles/') || p.startsWith('handlePositions/')) && !zip.files[p]?.dir,
    );
    const imageDataUrls = new Map<string, string>();
    for (const p of imagePaths) {
      const entry = zip.file(p);
      if (!entry) continue;
      const base64 = await entry.async('base64');
      imageDataUrls.set(p, `data:image/png;base64,${base64}`);
    }

    const handlesRaw = parsed.handles;
    const positionsRaw = parsed.handlePositions;

    const handlePositions: { name: string; image: string }[] = [];
    if (Array.isArray(positionsRaw)) {
      for (const row of positionsRaw as HandlePositionJsonRow[]) {
        const imagePath = typeof row.image === 'string' ? row.image : '';
        const dataUrl = imagePath ? imageDataUrls.get(imagePath) : undefined;
        if (imagePath && !dataUrl) {
          warnings.push(`Missing image in ZIP for handle position path: ${imagePath}`);
        }
        handlePositions.push({
          name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
          image: dataUrl ?? imagePath,
        });
      }
    } else {
      warnings.push('handles.json did not contain a handlePositions array.');
    }

    const handles: ReturnType<typeof normalizeHandleRow>[] = [];
    if (!Array.isArray(handlesRaw)) {
      warnings.push('handles.json did not contain a handles array.');
    } else {
      for (const row of handlesRaw as HandleJsonRow[]) {
        handles.push(normalizeHandleRow(row, imageDataUrls, warnings));
      }
    }

    const data = { handles, handlePositions };

    return { ok: true as const, data, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 422,
      statusMessage: `Could not read handles extractor ZIP: ${msg}`,
      data: { warnings },
    });
  }
});

function normalizeHandleRow(
  row: HandleJsonRow,
  imageDataUrls: Map<string, string>,
  warnings: string[],
) {
  const imagePath = typeof row.image === 'string' ? row.image : '';
  const dataUrl = imagePath ? imageDataUrls.get(imagePath) : undefined;
  if (imagePath && !dataUrl) {
    warnings.push(`Missing image in ZIP for handle path: ${imagePath}`);
  }
  return {
    code: typeof row.code === 'string' ? row.code : String(row.code ?? ''),
    name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
    handlePostions:
      typeof row.handlePostions === 'string'
        ? row.handlePostions
        : String(row.handlePostions ?? ''),
    height: typeof row.height === 'string' ? row.height : String(row.height ?? ''),
    surcharge: typeof row.surcharge === 'string' ? row.surcharge : String(row.surcharge ?? ''),
    type: typeof row.type === 'string' ? row.type : String(row.type ?? ''),
    subtype: typeof row.subtype === 'string' ? row.subtype : String(row.subtype ?? ''),
    description:
      typeof row.description === 'string' ? row.description : String(row.description ?? ''),
    image: dataUrl ?? imagePath,
  };
}
