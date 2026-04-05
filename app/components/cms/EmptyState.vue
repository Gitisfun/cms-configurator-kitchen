<template>
  <div class="empty-state">
    <div class="empty-state__icon-wrap">
      <Icon :name="icon" class="empty-state__icon" />
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  border-style: dashed;
}

.empty-state__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-info-muted);
  margin-bottom: 1rem;
}

.empty-state__icon {
  width: 28px;
  height: 28px;
  color: var(--color-text-muted);
}

.empty-state__title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.375rem;
}

.empty-state__description {
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: var(--line-height-body);
}

.empty-state__actions {
  margin-top: 1.25rem;
}
</style>
