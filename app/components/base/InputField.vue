<template>
  <label
    class="base-input-field"
    :class="{ 'base-input-field--spaced': spaced }"
  >
    <span class="base-input-field__label">
      {{ label }}
      <span v-if="requiredMark" class="base-input-field__req" aria-hidden="true">*</span>
    </span>
    <slot v-if="$slots.default" />
    <input
      v-else
      ref="inputRef"
      v-model="model"
      class="base-input-field__input"
      v-bind="$attrs"
    />
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    label: string;
    /** Visually mark the label as required (e.g. asterisk). */
    requiredMark?: boolean;
    spaced?: boolean;
  }>(),
  {
    requiredMark: false,
    spaced: false,
  },
);

const model = defineModel<string>({ default: '' });

const inputRef = ref<HTMLInputElement | null>(null);

defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>

<style scoped>
.base-input-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.base-input-field--spaced {
  margin-top: 1rem;
}

.base-input-field__label {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
}

.base-input-field__req {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.base-input-field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.base-input-field__input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.base-input-field__input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.base-input-field__input::placeholder {
  color: var(--color-text-muted-light);
}
</style>
