import { buildDepthOptionData } from '../../utils/depthOptionPayload';
import { mergePreservedDepthOptionRelations } from '../../utils/depthOptionPreserveRelations';

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
  const documentId = getRouterParam(event, 'documentId');

  if (!documentId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document id' });
  }

  const body = await readBody(event).catch(() => null);

  let data: Record<string, unknown>;
  try {
    data = buildDepthOptionData(body);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e;
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  try {
    const existingRes = await $fetch<{ data?: Record<string, unknown> }>(
      `${config.strapiUrl}/api/depth-options/${encodeURIComponent(documentId)}?populate[cabinetTypes]=true`,
      {
        headers: {
          Authorization: `Bearer ${config.strapiToken}`,
        },
      },
    );
    mergePreservedDepthOptionRelations(data, existingRes.data);
  } catch {
    /* If prefetch fails, still attempt update with body only. */
  }

  try {
    return await $fetch(`${config.strapiUrl}/api/depth-options/${encodeURIComponent(documentId)}`, {
      method: 'PUT',
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
