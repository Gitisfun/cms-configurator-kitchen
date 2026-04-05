export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const search = getRequestURL(event).search ?? '';

  return await $fetch(`${config.strapiUrl}/api/price-classes${search}`, {
    headers: {
      Authorization: `Bearer ${config.strapiToken}`,
    },
  });
});
