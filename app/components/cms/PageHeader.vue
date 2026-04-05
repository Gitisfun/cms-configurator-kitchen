<template>
  <header class="page-header">
    <div class="page-header__text">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: var(--page-header-margin-bottom);
}

.page-header__title {
  font-family: var(--font-serif);
  font-size: var(--header-size-medium);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-heading);
}

.page-header__description {
  margin-top: 0.375rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .page-header__title {
    font-size: var(--header-size-medium-desktop);
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
