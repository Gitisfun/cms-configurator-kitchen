<template>
  <div
    class="base-message"
    :class="`base-message--${variant}`"
    role="alert"
  >
    <Icon :name="iconName" class="base-message__icon" />
    <span class="base-message__text">
      <slot />
    </span>
    <button
      v-if="dismissible"
      type="button"
      class="base-message__close"
      aria-label="Dismiss"
      @click="emit('dismiss')"
    >
      <Icon name="lucide:x" />
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant: 'error' | 'success';
    dismissible?: boolean;
  }>(),
  {
    dismissible: true,
  },
);

const emit = defineEmits<{
  dismiss: [];
}>();

const iconName = computed(() =>
  props.variant === 'error' ? 'lucide:alert-triangle' : 'lucide:check-circle',
);
</script>

<style scoped>
.base-message {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.base-message--error {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.base-message--success {
  background: var(--color-success-muted);
  color: #047a3a;
}

.base-message__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.base-message__text {
  min-width: 0;
}

.base-message__close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  flex-shrink: 0;
}

.base-message__close:hover {
  opacity: 1;
}
</style>
