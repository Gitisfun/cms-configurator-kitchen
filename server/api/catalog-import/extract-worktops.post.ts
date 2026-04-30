import { Buffer } from 'node:buffer';
import { readMultipartFormData } from 'h3';
import JSZip from 'jszip';

/**
 * BFF: forwards catalog PDF to Python `/extract/worktops` (multipart `file`),
 * unpacks ZIP (`worktops.json` + `worktops/*.png`), returns rows with image data URLs.
 */
const DEFAULT_WORKTOPS = 'http://localhost:5001/extract/worktops';

function resolveWorktopsExtractUrl(): string {
  const explicit = process.env.PDF_EXTRACT_WORKTOPS_URL?.trim();
  if (explicit) return explicit;
  const cabinet = process.env.PDF_EXTRACT_API_URL?.trim();
  if (cabinet) {
    try {
      const u = new URL(cabinet);
      u.pathname = '/extract/worktops';
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_WORKTOPS;
}

type WorktopJsonRow = {
  image: string;
  code: string;
  note: string;
  name: string;
  description: string;
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

  const url = resolveWorktopsExtractUrl();
  const outbound = new FormData();
  const uploadBlob = new Blob([new Uint8Array(buf)], { type: 'application/pdf' });
  outbound.append('file', uploadBlob, filePart.filename || 'upload.pdf');

  let zipBytes: Uint8Array;
  try {
    const res = await fetch(url, { method: 'POST', body: outbound });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Worktops extractor failed (${res.status})`);
    }
    zipBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not call worktops extractor (${url}): ${msg}`,
    });
  }

  let rawRows: unknown;
  const warnings: string[] = [];
  try {
    const zip = await JSZip.loadAsync(Buffer.from(zipBytes));
    const files = Object.keys(zip.files);
    const jsonPath = files.find((p) => /(^|\/)worktops\.json$/i.test(p) && !zip.files[p]?.dir);
    if (!jsonPath) {
      throw new Error('ZIP does not contain worktops.json');
    }
    const jsonStr = await zip.file(jsonPath)!.async('string');
    rawRows = JSON.parse(jsonStr);

    const imagePaths = files.filter((p) => p.startsWith('worktops/') && !zip.files[p]?.dir);
    const imageDataUrls = new Map<string, string>();
    for (const p of imagePaths) {
      const entry = zip.file(p);
      if (!entry) continue;
      const base64 = await entry.async('base64');
      imageDataUrls.set(p, `data:image/png;base64,${base64}`);
    }

    let list: WorktopJsonRow[];
    if (Array.isArray(rawRows)) {
      list = rawRows as WorktopJsonRow[];
    } else if (rawRows && typeof rawRows === 'object') {
      list = [rawRows as WorktopJsonRow];
      warnings.push('worktops.json was a single object; wrapped as a one-element array.');
    } else {
      throw new Error('worktops.json must be a JSON array or object.');
    }

    const data = list.map((row) => {
      const imagePath = typeof row.image === 'string' ? row.image : '';
      const dataUrl = imagePath ? imageDataUrls.get(imagePath) : undefined;
      if (imagePath && !dataUrl) {
        warnings.push(`Missing image in ZIP for path: ${imagePath}`);
      }
      return {
        image: dataUrl ?? imagePath,
        code: typeof row.code === 'string' ? row.code : String(row.code ?? ''),
        note: typeof row.note === 'string' ? row.note : String(row.note ?? ''),
        name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
        description: typeof row.description === 'string' ? row.description : String(row.description ?? ''),
      };
    });

    if (data.length === 0 && imagePaths.length > 0) {
      warnings.push('ZIP contained worktop images but worktops.json was empty.');
    }

    return { ok: true as const, data, warnings };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 422,
      statusMessage: `Could not read worktops extractor ZIP: ${msg}`,
      data: { warnings },
    });
  }
});
