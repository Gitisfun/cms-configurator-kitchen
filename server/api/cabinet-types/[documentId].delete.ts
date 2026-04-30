import { deleteCabinetTypeChildrenStrapi } from '../../utils/deleteCabinetTypeCascadeStrapi';

function strapiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: { message?: string } } }).data;
    const msg = data?.error?.message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}

export default defineEventHandler(async (event): Promise<unknown> => {
  const config = useRuntimeConfig();
  const documentId = getRouterParam(event, 'documentId');

  if (!documentId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document id' });
  }

  try {
    await deleteCabinetTypeChildrenStrapi(config.strapiUrl, config.strapiToken, documentId);
    return await $fetch(`${config.strapiUrl}/api/cabinet-types/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.strapiToken}`,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const status = Number((err as { statusCode: number }).statusCode);
      if (status >= 400 && status < 600) throw err;
    }
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
