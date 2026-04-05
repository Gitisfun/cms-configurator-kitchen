const MAX_NAME_LEN = 255;

function parseRelationId(
  value: unknown,
  fieldLabel: string,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim());
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldLabel}` });
    }
    return n;
  }
  throw createError({ statusCode: 400, statusMessage: `Invalid ${fieldLabel}` });
}

/**
 * Build Strapi `data` for subcategory create/update.
 * Exactly one of `category` or `parent` (self) must be set — enforced via `categoryId` / `parentSubcategoryId` in the body.
 */
export function buildSubcategoryData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' });
  }
  if (name.length > MAX_NAME_LEN) {
    throw createError({
      statusCode: 400,
      statusMessage: `Name must be at most ${MAX_NAME_LEN} characters`,
    });
  }

  if (!('categoryId' in b) || !('parentSubcategoryId' in b)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'categoryId and parentSubcategoryId are required (exactly one must be set)',
    });
  }

  const categoryId = parseRelationId(b.categoryId, 'categoryId');
  const parentSubcategoryId = parseRelationId(b.parentSubcategoryId, 'parentSubcategoryId');

  const hasCategory = categoryId !== null;
  const hasParent = parentSubcategoryId !== null;

  if (hasCategory && hasParent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subcategory must belong to either a category or a parent subcategory, not both',
    });
  }
  if (!hasCategory && !hasParent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subcategory must belong to a category or a parent subcategory',
    });
  }

  const data: Record<string, unknown> = {
    name,
    category: hasCategory ? categoryId : null,
    parent: hasParent ? parentSubcategoryId : null,
  };

  if ('imageId' in b) {
    const img = b.imageId;
    if (img === null) {
      data.image = null;
    } else if (typeof img === 'number' && Number.isFinite(img)) {
      data.image = img;
    } else if (typeof img === 'string' && img.trim() !== '') {
      const n = Number(img.trim());
      if (!Number.isFinite(n)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid imageId' });
      }
      data.image = n;
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid imageId' });
    }
  }

  return data;
}
