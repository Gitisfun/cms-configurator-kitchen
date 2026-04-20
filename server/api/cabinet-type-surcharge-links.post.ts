import { parseCreateSurchargeLink } from '../utils/surchargeLinkPayload';
import { strapiErrorMessage, strapiErrorStatus } from '../utils/strapiErrorMessage';

interface StrapiCreated {
  data: { id: number; documentId: string };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const rawBody = await readBody(event).catch(() => null);

  const parsed = parseCreateSurchargeLink(rawBody);

  const authHeaders = {
    Authorization: `Bearer ${config.strapiToken}`,
    'Content-Type': 'application/json',
  } as const;

  let linkRes: StrapiCreated;
  try {
    linkRes = await $fetch<StrapiCreated>(
      `${config.strapiUrl}/api/cabinet-type-surcharge-links`,
      {
        method: 'POST',
        headers: authHeaders,
        body: {
          data: {
            cabinetType: parsed.cabinetTypeId,
            surcharge: parsed.surchargeId,
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

  const linkNumericId = linkRes.data.id;
  const linkDocumentId = linkRes.data.documentId;

  const createdPriceDocIds: string[] = [];
  for (const p of parsed.prices) {
    try {
      const priceRes = await $fetch<StrapiCreated>(
        `${config.strapiUrl}/api/cabinet-type-surcharge-prices`,
        {
          method: 'POST',
          headers: authHeaders,
          body: {
            data: {
              link: linkNumericId,
              priceClass: p.priceClassId,
              price: p.price,
            },
          },
        },
      );
      createdPriceDocIds.push(priceRes.data.documentId);
    } catch (err: unknown) {
      await rollbackCreatedPrices(config.strapiUrl as string, config.strapiToken as string, createdPriceDocIds);
      await rollbackCreatedLink(config.strapiUrl as string, config.strapiToken as string, linkDocumentId);
      throw createError({
        statusCode: strapiErrorStatus(err),
        statusMessage: strapiErrorMessage(err),
      });
    }
  }

  return await $fetch(
    `${config.strapiUrl}/api/cabinet-type-surcharge-links/${encodeURIComponent(linkDocumentId)}?populate[surcharge]=true&populate[prices][populate][priceClass]=true&populate[cabinetType]=true`,
    { headers: { Authorization: `Bearer ${config.strapiToken}` } },
  );
});

async function rollbackCreatedPrices(strapiUrl: string, token: string, docIds: string[]): Promise<void> {
  for (const id of docIds) {
    try {
      await $fetch(`${strapiUrl}/api/cabinet-type-surcharge-prices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /** best-effort cleanup */
    }
  }
}

async function rollbackCreatedLink(strapiUrl: string, token: string, docId: string): Promise<void> {
  try {
    await $fetch(`${strapiUrl}/api/cabinet-type-surcharge-links/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /** best-effort cleanup */
  }
}
