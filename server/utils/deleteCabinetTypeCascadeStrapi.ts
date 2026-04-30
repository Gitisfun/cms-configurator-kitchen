import { createError } from 'h3';

import { strapiErrorMessage, strapiErrorStatus } from './strapiErrorMessage';
import { strapiRelationList } from './strapiRelationList';

type WithDoc = { documentId?: string };
type VariantRow = WithDoc & { prices?: unknown };
type SurchargeLinkRow = WithDoc & { prices?: unknown };

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function priceDocumentIds(prices: unknown): string[] {
  return strapiRelationList<WithDoc>(prices as WithDoc[] | { data: WithDoc[] })
    .map((p) => p.documentId)
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '');
}

async function deleteSurchargeLinkPricesAndLink(
  base: string,
  headers: Record<string, string>,
  link: SurchargeLinkRow,
): Promise<void> {
  const linkDocumentId = link.documentId?.trim();
  if (!linkDocumentId) return;

  for (const pid of priceDocumentIds(link.prices)) {
    try {
      await $fetch(`${base}/api/cabinet-type-surcharge-prices/${encodeURIComponent(pid)}`, {
        method: 'DELETE',
        headers,
      });
    } catch {
      /** best-effort */
    }
  }

  try {
    await $fetch(`${base}/api/cabinet-type-surcharge-links/${encodeURIComponent(linkDocumentId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    /** best-effort */
  }
}

/**
 * Before deleting a cabinet type: remove surcharge links (and their prices), disconnect depth options,
 * delete variants (and cabinet prices), then the caller may delete the cabinet type.
 */
export async function deleteCabinetTypeChildrenStrapi(
  strapiUrl: string,
  strapiToken: string,
  cabinetTypeDocumentId: string,
): Promise<void> {
  const base = strapiUrl.replace(/\/$/, '');
  const headers = authHeaders(strapiToken);

  const qs =
    'populate[variants][populate][prices]=true&populate[surchargeLinks][populate][prices]=true&populate[depthOptions]=true';
  const res = await $fetch<{ data?: Record<string, unknown> }>(
    `${base}/api/cabinet-types/${encodeURIComponent(cabinetTypeDocumentId)}?${qs}`,
    { headers },
  );

  const row = res.data;
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cabinet type not found' });
  }

  const ctDocId =
    typeof row.documentId === 'string' && row.documentId.trim() !== ''
      ? row.documentId.trim()
      : cabinetTypeDocumentId;

  const surchargeLinks = strapiRelationList<SurchargeLinkRow>(
    row.surchargeLinks as SurchargeLinkRow[] | { data: SurchargeLinkRow[] } | null | undefined,
  );
  for (const link of surchargeLinks) {
    await deleteSurchargeLinkPricesAndLink(base, headers, link);
  }

  const depthOptions = strapiRelationList<WithDoc>(
    row.depthOptions as WithDoc[] | { data: WithDoc[] } | null | undefined,
  );
  for (const d of depthOptions) {
    const did = d.documentId?.trim();
    if (!did) continue;
    try {
      await $fetch(`${base}/api/depth-options/${encodeURIComponent(did)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: { data: { cabinetTypes: { disconnect: [ctDocId] } } },
      });
    } catch {
      /** best-effort unlink */
    }
  }

  const variants = strapiRelationList<VariantRow>(
    row.variants as VariantRow[] | { data: VariantRow[] } | null | undefined,
  );
  for (const v of variants) {
    const vDoc = v.documentId?.trim();
    if (!vDoc) continue;
    for (const pid of priceDocumentIds(v.prices)) {
      try {
        await $fetch(`${base}/api/cabinet-prices/${encodeURIComponent(pid)}`, {
          method: 'DELETE',
          headers,
        });
      } catch {
        /** best-effort */
      }
    }
    try {
      await $fetch(`${base}/api/cabinet-variants/${encodeURIComponent(vDoc)}`, {
        method: 'DELETE',
        headers,
      });
    } catch (err: unknown) {
      throw createError({
        statusCode: strapiErrorStatus(err),
        statusMessage: strapiErrorMessage(err),
      });
    }
  }
}
