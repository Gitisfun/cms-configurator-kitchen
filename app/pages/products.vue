<template>
  <div>
    <CmsPageHeader
      title="Products"
      description="Manage kitchen products and configurations."
    >
      <template #actions>
        <button class="btn btn--primary">
          <Icon name="lucide:plus" class="btn__icon" />
          Add Product
        </button>
      </template>
    </CmsPageHeader>

    <CmsEmptyState
      icon="lucide:package"
      title="No products yet"
      description="Create your first product to start building your kitchen catalogue."
    >
      <button class="btn btn--primary">
        <Icon name="lucide:plus" class="btn__icon" />
        Create Product
      </button>
    </CmsEmptyState>
  </div>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--button-padding-y) var(--button-padding-x);
  border: none;
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-button);
  min-height: var(--button-min-height);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  box-shadow: var(--button-shadow);
}

.btn--primary:hover {
  background: var(--button-primary-bg-hover);
  box-shadow: var(--button-shadow-hover);
}

.btn__icon {
  width: 16px;
  height: 16px;
}
</style>
