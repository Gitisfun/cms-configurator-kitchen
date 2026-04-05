<template>
  <nav
    class="base-pagination"
    :class="{
      'base-pagination--panel': variant === 'panel',
      'base-pagination--section': variant === 'section',
    }"
    :aria-label="ariaLabel"
  >
    <BaseButton
      type="button"
      variant="outlined"
      :disabled="prevDisabled"
      @click="goPrev"
    >
      <Icon name="lucide:chevron-left" class="base-btn__icon" />
      Previous
    </BaseButton>
    <span class="base-pagination__info">{{ infoText }}</span>
    <BaseButton
      type="button"
      variant="outlined"
      :disabled="nextDisabled"
      @click="goNext"
    >
      Next
      <Icon name="lucide:chevron-right" class="base-btn__icon" />
    </BaseButton>
  </nav>
</template>

<script setup lang="ts">
const page = defineModel<number>('page', { required: true });

const props = withDefaults(
  defineProps<{
    /** When set, shows "Page X of Y" and derives prev/next from page bounds. */
    pageCount?: number | null;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    variant?: 'panel' | 'section';
  }>(),
  {
    pageCount: undefined,
    hasPreviousPage: undefined,
    hasNextPage: undefined,
    disabled: false,
    ariaLabel: 'Pages',
    variant: 'section',
  },
);

const usesPageCount = computed(
  () => props.pageCount != null && props.pageCount > 0,
);

const prevDisabled = computed(() => {
  if (props.disabled) return true;
  if (usesPageCount.value) {
    return page.value <= 1;
  }
  return !(props.hasPreviousPage ?? false);
});

const nextDisabled = computed(() => {
  if (props.disabled) return true;
  if (usesPageCount.value) {
    return page.value >= (props.pageCount as number);
  }
  return !(props.hasNextPage ?? false);
});

const infoText = computed(() => {
  if (usesPageCount.value) {
    return `Page ${page.value} of ${props.pageCount}`;
  }
  return `Page ${page.value}`;
});

function goPrev() {
  if (prevDisabled.value) return;
  page.value = page.value - 1;
}

function goNext() {
  if (nextDisabled.value) return;
  page.value = page.value + 1;
}
</script>

<style scoped>
.base-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.base-pagination--panel {
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.base-pagination--section {
  margin-top: 1.5rem;
}

.base-pagination__info {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-align: center;
}

.base-pagination--panel .base-pagination__info {
  min-width: 8rem;
}

.base-pagination--section .base-pagination__info {
  min-width: 5rem;
}
</style>
