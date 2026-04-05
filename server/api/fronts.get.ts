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
    sp.set('populate[priceClass]', 'true');
  }
  const qs = sp.toString();

  return await $fetch(`${config.strapiUrl}/api/fronts${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${config.strapiToken}`,
    },
  });
});
