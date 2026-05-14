<template>
  <div class="bulk-selector">
    <span id="bulk-selector-label" class="bulk-selector__label">Import type</span>
    <div class="bulk-selector__toggle" role="group" aria-labelledby="bulk-selector-label">
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        class="bulk-selector__btn"
        :class="{ 'bulk-selector__btn--active': modelValue === opt.value }"
        @click="$emit('update:modelValue', opt.value)"
      >
        <Icon :name="opt.icon" class="bulk-selector__btn-icon" />
        {{ opt.label }}
      </button>
    </div>
    <p class="bulk-selector__hint">{{ modeHint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type BulkImportTarget = 'cabinets' | 'fronts' | 'backs' | 'plinths' | 'handles' | 'worktops';

const OPTIONS: { value: BulkImportTarget; label: string; icon: string }[] = [
  { value: 'cabinets', label: 'Cabinets', icon: 'lucide:boxes' },
  { value: 'fronts', label: 'Fronts', icon: 'lucide:panel-top' },
  { value: 'backs', label: 'Backs', icon: 'lucide:panel-bottom' },
  { value: 'plinths', label: 'Plinths', icon: 'lucide:stretch-horizontal' },
  { value: 'handles', label: 'Handles', icon: 'lucide:grip-horizontal' },
  { value: 'worktops', label: 'Worktops', icon: 'lucide:rectangle-horizontal' },
];

const props = defineProps<{
  modelValue: BulkImportTarget;
}>();

defineEmits<{
  'update:modelValue': [value: BulkImportTarget];
}>();

const modeHint = computed(() => {
  switch (props.modelValue) {
    case 'cabinets':
      return 'PDF upload fills cabinet catalog JSON and preview images. Use Validate / Import for Strapi.';
    case 'backs':
      return 'PDF upload fills the grid and JSON. Click a card to edit code or name, or delete a preview row. Use Import to catalog to send previews to Strapi.';
    case 'plinths':
      return 'PDF upload fills the grid and JSON. Click a card to edit fields or delete a preview row. Use Import to catalog to send previews to Strapi.';
    case 'handles':
      return 'Positions appear first; handles are grouped by type and subtype. Import each group to Strapi; editing JSON or cards resets import flags.';
    case 'worktops':
      return 'PDF upload fills the grid and JSON. Click a card to edit fields or optional surcharge price, or delete a preview row. Use Import to catalog to send previews to Strapi.';
    default:
      return 'PDF upload fills the grid and JSON. Click a card to edit or delete a preview row. Use Import to catalog on each price class for Strapi (levels 0–8 must exist as price classes).';
  }
});
</script>

<style scoped>
.bulk-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.bulk-selector__label {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.bulk-selector__toggle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.bulk-selector__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.bulk-selector__btn:hover {
  color: var(--color-text-primary);
  background: rgba(27, 58, 92, 0.06);
}

.bulk-selector__btn--active {
  color: var(--color-text-primary);
  background: rgba(27, 58, 92, 0.1);
  box-shadow: 0 0 0 1px rgba(27, 58, 92, 0.12);
}

.bulk-selector__btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-brand);
  opacity: 0.85;
}

.bulk-selector__hint {
  margin: 0.35rem 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
  max-width: 52rem;
}
</style>
