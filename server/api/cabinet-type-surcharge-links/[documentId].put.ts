import { parseUpdateSurchargeLink } from '../../utils/surchargeLinkPayload';
import { strapiErrorMessage, strapiErrorStatus } from '../../utils/strapiErrorMessage';

interface ExistingLink {
  data?: {
    id: number;
    documentId: string;
    prices?: Array<{ id: number; documentId: string }>;
  };
}

interface StrapiCreated {
  data: { id: number; documentId: string };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const documentId = getRouterParam(event, 'documentId');

  if (!documentId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document id' });
  }

  const rawBody = await readBody(event).catch(() => null);
  const parsed = parseUpdateSurchargeLink(rawBody);

  const authHeaders = {
    Authorization: `Bearer ${config.strapiToken}`,
    'Content-Type': 'application/json',
  } as const;

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

  const existingLinkNumericId = existing.data?.id;
  if (existingLinkNumericId == null) {
    throw createError({ statusCode: 404, statusMessage: 'Surcharge link not found' });
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
    } catch (err: unknown) {
      throw createError({
        statusCode: strapiErrorStatus(err),
        statusMessage: strapiErrorMessage(err),
      });
    }
  }

  for (const p of parsed.prices) {
    try {
      await $fetch<StrapiCreated>(
        `${config.strapiUrl}/api/cabinet-type-surcharge-prices`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            data: {
              link: existingLinkNumericId,
              priceClass: p.priceClassId,
              price: p.price,
            },
          },
        },
      );
    } catch (err: unknown) {
      throw createError({
        statusCode: strapiErrorStatus(err),
        statusMessage: strapiErrorMessage(err),
      });
    }
  }

  return await $fetch(
    `${config.strapiUrl}/api/cabinet-type-surcharge-links/${encodeURIComponent(documentId)}?populate[surcharge]=true&populate[prices][populate][priceClass]=true&populate[cabinetType]=true`,
    { headers: { Authorization: `Bearer ${config.strapiToken}` } },
  );
});
