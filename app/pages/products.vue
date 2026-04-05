<template>
  <div>
    <CmsPageHeader
      title="Products"
      description="Manage kitchen products and configurations."
    >
      <template #actions>
        <BaseButton type="button">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add Product
        </BaseButton>
      </template>
    </CmsPageHeader>

    <CmsEmptyState
      icon="lucide:package"
      title="No products yet"
      description="Create your first product to start building your kitchen catalogue."
    >
      <BaseButton type="button">
        <Icon name="lucide:plus" class="base-btn__icon" />
        Create Product
      </BaseButton>
    </CmsEmptyState>
  </div>
</template>
