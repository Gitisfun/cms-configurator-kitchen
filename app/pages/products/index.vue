<template>
  <div>
    <CmsPageHeader title="Products" description="Manage sellable products and how they appear in the configurator. Content for this area will be added here." />

    <BasePanel
      :pending="false"
      :error="false"
      :pagination="null"
      :empty-first-page="true"
      :empty-off-page="false"
      :item-count="0"
      :page="1"
    >
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:package" />
        </div>
        <h3 class="base-panel__empty-title">Products</h3>
        <p class="base-panel__empty-desc">This page is reserved for product management. Cabinet series and catalog editing live under Catalog.</p>
        <NuxtLink to="/catalog" class="products-placeholder__link">
          <BaseButton type="button" variant="outlined">
            <Icon name="lucide:layout-grid" class="base-btn__icon" />
            Open catalog
          </BaseButton>
        </NuxtLink>
      </template>
    </BasePanel>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.products-placeholder__link {
  text-decoration: none;
  display: inline-flex;
}
</style>
