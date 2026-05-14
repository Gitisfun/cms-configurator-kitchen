<template>
  <BaseButton
    type="button"
    :size="size"
    :variant="imported ? 'outlined' : 'primary'"
    :disabled="disabled || importing || imported"
    :loading="importing"
    :class="['bulk-import-btn', { 'bulk-import-btn--success': imported }]"
    @click="$emit('click')"
  >
    <Icon :name="imported ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
    {{ imported ? successLabel : 'Import to catalog' }}
  </BaseButton>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    imported: boolean;
    importing: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
    successLabel?: string;
  }>(),
  {
    disabled: false,
    size: 'sm',
    successLabel: 'Imported',
  },
);

defineEmits<{ click: [] }>();
</script>

<style scoped>
.bulk-import-btn--success {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  opacity: 1 !important;
}

.bulk-import-btn--success:hover {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  background: rgba(6, 118, 71, 0.08) !important;
}

.bulk-import-btn--success :deep(.base-btn__icon) {
  color: var(--color-success, #067647) !important;
}
</style>
