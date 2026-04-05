export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
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
    sp.set('populate[image]', 'true');
  }

  let hasSort = false;
  for (const k of sp.keys()) {
    if (k === 'sort' || k.startsWith('sort[')) {
      hasSort = true;
      break;
    }
  }
  if (!hasSort) {
    sp.set('sort[0]', 'name:asc');
  }

  const qs = sp.toString();

  return await $fetch(`${config.strapiUrl}/api/handle-positions${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${config.strapiToken}`,
    },
  });
});
