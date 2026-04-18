export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const documentId = getRouterParam(event, 'documentId');

  if (!documentId?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing document id' });
  }

  const eventUrl = getRequestURL(event);
  const sp = new URLSearchParams(eventUrl.search.replace(/^\?/, ''));

  let hasPopulate = false;
  for (const k of sp.keys()) {
    if (k === 'populate' || k.startsWith('populate[')) {
      hasPopulate = true;
      break;
    }
  }
  if (!hasPopulate) {
    sp.set('populate[subcategory]', 'true');
  }

  const qs = sp.toString();

  return await $fetch(
    `${config.strapiUrl}/api/cabinet-series/${encodeURIComponent(documentId)}${qs ? `?${qs}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${config.strapiToken}`,
      },
    },
  );
});
