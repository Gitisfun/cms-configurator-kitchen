import { buildCabinetPriceData } from '../utils/cabinetPricePayload';

function strapiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: { message?: string } } }).data;
    const msg = data?.error?.message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event).catch(() => null);

  let data: Record<string, unknown>;
  try {
    data = buildCabinetPriceData(body);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e;
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  try {
    return await $fetch(`${config.strapiUrl}/api/cabinet-prices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.strapiToken}`,
        'Content-Type': 'application/json',
      },
      body: { data },
    });
  } catch (err: unknown) {
    const status =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode: number }).statusCode)
        : 502;
    throw createError({
      statusCode: status >= 400 && status < 600 ? status : 502,
      statusMessage: strapiErrorMessage(err),
    });
  }
});
