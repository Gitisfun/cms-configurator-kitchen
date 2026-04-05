<template>
  <section class="base-panel">
    <div
      v-if="!pending && !error && pagination != null && $slots.toolbar"
      class="base-panel__toolbar"
    >
      <span class="base-panel__summary">
        <slot name="toolbar" />
      </span>
    </div>

    <div v-if="pending" class="base-panel__loading">
      <span class="base-panel__spinner" />
      <span><slot name="loading">Loading&hellip;</slot></span>
    </div>

    <div
      v-else-if="error"
      class="base-panel__alert base-panel__alert--error"
    >
      <slot name="error" />
    </div>

    <div v-else-if="emptyFirstPage" class="base-panel__empty">
      <slot name="empty" />
    </div>

    <div v-else-if="emptyOffPage" class="base-panel__empty-offpage">
      <slot name="empty-offpage" />
    </div>

    <slot v-else />

    <slot v-if="showPagination" name="pagination" />
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    pending?: boolean;
    error?: boolean;
    pagination?: { pageCount: number; total: number } | null;
    emptyFirstPage?: boolean;
    emptyOffPage?: boolean;
    itemCount?: number;
    page?: number;
  }>(),
  {
    pending: false,
    error: false,
    pagination: null,
    emptyFirstPage: false,
    emptyOffPage: false,
    itemCount: 0,
    page: 1,
  },
);

const showPagination = computed(
  () =>
    !props.pending
    && !props.error
    && props.pagination != null
    && (props.itemCount > 0 || props.page > 1),
);
</script>

<style scoped>
.base-panel {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.base-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.base-panel__summary {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.base-panel__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-medium);
}

.base-panel__spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: base-panel-spin 0.6s linear infinite;
}

.base-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.base-panel__empty :deep(.base-panel__empty-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-info-muted);
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.base-panel__empty :deep(.base-panel__empty-icon svg) {
  width: 28px;
  height: 28px;
}

.base-panel__empty :deep(.base-panel__empty-title) {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.375rem;
}

.base-panel__empty :deep(.base-panel__empty-desc) {
  margin: 0;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: var(--line-height-body);
}

.base-panel__empty :deep(.base-btn) {
  margin-top: 1.25rem;
}

.base-panel__empty-offpage {
  padding: 1.5rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.base-panel__empty-offpage :deep(.base-panel__empty-page) {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
}

.base-panel__alert {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 1rem 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.base-panel__alert--error {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.base-panel__alert :deep(.base-panel__alert-icon) {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes base-panel-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
