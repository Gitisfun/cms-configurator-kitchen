<template>
  <button
    :type="type"
    class="base-btn"
    :class="{
      'base-btn--primary': variant === 'primary',
      'base-btn--outlined': variant === 'outlined',
      'base-btn--text': variant === 'text',
      'base-btn--sm': size === 'sm',
      'base-btn--text-danger': variant === 'text' && danger,
    }"
    :disabled="disabled || loading"
  >
    <span
      v-if="loading"
      class="base-btn__spinner"
      :class="{ 'base-btn__spinner--dark': variant !== 'primary' }"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'outlined' | 'text';
    size?: 'md' | 'sm';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    danger?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    danger: false,
  },
);
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.base-btn:disabled {
  opacity: var(--button-disabled-opacity);
  cursor: not-allowed;
}

.base-btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  box-shadow: var(--button-shadow);
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--button-primary-bg-hover);
  box-shadow: var(--button-shadow-hover);
}

.base-btn--outlined {
  background: var(--button-outlined-bg);
  color: var(--button-outlined-color);
  border: 1px solid var(--button-outlined-border);
}

.base-btn--outlined:hover:not(:disabled) {
  background: var(--button-outlined-hover-bg);
}

.base-btn--sm {
  min-height: 32px;
  padding: 0.375rem 0.75rem;
  font-size: 13px;
}

.base-btn--text {
  background: transparent;
  color: var(--color-brand);
  border: none;
  min-height: auto;
  padding: 0.25rem 0.5rem;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  letter-spacing: normal;
  box-shadow: none;
}

.base-btn--text:hover:not(:disabled) {
  background: var(--color-success-muted);
  color: var(--color-brand-hover);
}

.base-btn--text-danger {
  color: var(--color-error);
}

.base-btn--text-danger:hover:not(:disabled) {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.base-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: base-btn-spin 0.6s linear infinite;
  flex-shrink: 0;
}

.base-btn__spinner--dark {
  border-color: var(--color-border);
  border-top-color: var(--color-brand);
}

@keyframes base-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

:slotted(.base-btn__icon) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
