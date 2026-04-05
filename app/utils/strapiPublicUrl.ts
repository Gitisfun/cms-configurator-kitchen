const STRAPI_PUBLIC_DEFAULT = 'http://localhost:1337';

export function normalizeStrapiPublicBase(strapiUrl?: string | null): string {
  return String(strapiUrl || STRAPI_PUBLIC_DEFAULT).replace(/\/$/, '');
}

export function useStrapiPublicUrl() {
  const { public: publicConfig } = useRuntimeConfig();
  return computed(() =>
    normalizeStrapiPublicBase(publicConfig.strapiUrl as string | undefined),
  );
}
