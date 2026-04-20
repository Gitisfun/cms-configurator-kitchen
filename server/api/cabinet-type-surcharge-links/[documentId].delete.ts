import { strapiErrorMessage, strapiErrorStatus } from '../../utils/strapiErrorMessage';

interface ExistingLink {
  data?: {
    id: number;
    documentId: string;
    prices?: Array<{ id: number; documentId: string }>;
  };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const documentId = getRouterParam(event, 'documentId');

  if (!documentId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document id' });
  }

  let existing: ExistingLink;
  try {
    existing = await $fetch<ExistingLink>(
      `${config.strapiUrl}/api/cabinet-type-surcharge-links/${encodeURIComponent(documentId)}?populate[prices]=true`,
      { headers: { Authorization: `Bearer ${config.strapiToken}` } },
    );
  } catch (err: unknown) {
    throw createError({
      statusCode: strapiErrorStatus(err),
      statusMessage: strapiErrorMessage(err),
    });
  }

  const existingPrices = existing.data?.prices ?? [];

  for (const p of existingPrices) {
    try {
      await $fetch(
        `${config.strapiUrl}/api/cabinet-type-surcharge-prices/${encodeURIComponent(p.documentId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${config.strapiToken}` },
        },
      );
    } catch {
      /** best-effort; continue to delete link */
    }
  }

  try {
    return await $fetch(
      `${config.strapiUrl}/api/cabinet-type-surcharge-links/${encodeURIComponent(documentId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.strapiToken}` },
      },
    );
  } catch (err: unknown) {
    throw createError({
      statusCode: strapiErrorStatus(err),
      statusMessage: strapiErrorMessage(err),
    });
  }
});
