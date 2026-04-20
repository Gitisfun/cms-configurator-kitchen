export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const eventUrl = getRequestURL(event);
  const sp = new URLSearchParams(eventUrl.search.replace(/^\?/, ''));

  const qs = sp.toString();

  return await $fetch(
    `${config.strapiUrl}/api/cabinet-type-surcharge-links${qs ? `?${qs}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${config.strapiToken}`,
      },
    },
  );
});
