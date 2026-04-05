<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="base-modal-backdrop"
      role="presentation"
      :style="{ zIndex: overlayZIndex }"
      @click.self="onBackdropClick"
    >
      <div
        class="base-modal"
        :class="{
          'base-modal--narrow': size === 'narrow',
          'base-modal--medium': size === 'medium',
          'base-modal--wide': size === 'wide',
        }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="headingId"
      >
        <div class="base-modal__header">
          <h2 :id="headingId" class="base-modal__title">
            <slot name="title">{{ title }}</slot>
          </h2>
          <button
            type="button"
            class="base-modal__close"
            aria-label="Close"
            :disabled="closeDisabled"
            @click="requestClose"
          >
            <Icon name="lucide:x" />
          </button>
        </div>
        <div
          class="base-modal__body"
          :class="{ 'base-modal__body--with-footer': $slots.footer }"
        >
          <slot />
        </div>
        <div v-if="$slots.footer" class="base-modal__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ required: true });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** Stable id for aria-labelledby; recommended for SSR-friendly labels. */
    titleId?: string;
    size?: 'narrow' | 'medium' | 'wide';
    /** Backdrop + dialog stacking; use higher value for nested modals. */
    overlayZIndex?: number;
    closeDisabled?: boolean;
    closeOnBackdrop?: boolean;
  }>(),
  {
    title: '',
    titleId: undefined,
    size: 'medium',
    overlayZIndex: 200,
    closeDisabled: false,
    closeOnBackdrop: true,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const autoTitleId = useId();
const headingId = computed(() => props.titleId ?? autoTitleId);

function requestClose() {
  if (props.closeDisabled) return;
  open.value = false;
  emit('close');
}

function onBackdropClick() {
  if (!props.closeOnBackdrop || props.closeDisabled) return;
  requestClose();
}
</script>

<style>
.base-modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(27, 58, 92, 0.45);
  backdrop-filter: blur(2px);
}

.base-modal {
  width: 100%;
  background: var(--color-surface-card);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow-hover);
  border: var(--card-border);
  outline: none;
}

.base-modal--narrow {
  max-width: 420px;
}

.base-modal--medium {
  max-width: 440px;
}

.base-modal--wide {
  max-width: min(720px, 100vw - 2rem);
}

.base-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.base-modal__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--header-size-medium);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-heading);
}

.base-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: -0.25rem -0.25rem 0 0;
  border: none;
  border-radius: var(--button-radius);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.base-modal__close:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.base-modal__close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.base-modal__close svg {
  width: 20px;
  height: 20px;
}

.base-modal__body {
  padding: 1rem 1.25rem 1.25rem;
}

.base-modal__body--with-footer {
  padding-bottom: 0;
}

.base-modal__body .base-modal__error {
  margin: 0.75rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.base-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0 1.25rem 1.25rem;
}
</style>
