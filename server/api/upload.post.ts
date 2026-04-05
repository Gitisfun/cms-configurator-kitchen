export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files provided' });
  }

  const body = new FormData();
  for (const part of formData) {
    if (!part.filename) continue;
    const blob = new Blob([part.data], { type: part.type || 'application/octet-stream' });
    body.append('files', blob, part.filename);
  }

  const response = await $fetch(`${config.strapiUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.strapiToken}`,
    },
    body,
  });

  return response;
});
