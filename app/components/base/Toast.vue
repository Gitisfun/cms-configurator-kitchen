<template>
  <div class="base-toast" :class="`base-toast--${variant}`" role="status">
    <div class="base-toast__icon" aria-hidden="true">
      <!-- Success: circle + check draw -->
      <svg v-if="variant === 'success'" class="base-toast__svg" viewBox="0 0 24 24" width="26" height="26">
        <circle class="base-toast__success-ring" cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.75" />
        <path
          class="base-toast__success-check"
          d="M7 12.5 L10.2 15.7 L17 8.9"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Info: pulsing dot + ring -->
      <svg v-else-if="variant === 'info'" class="base-toast__svg base-toast__svg--info" viewBox="0 0 24 24" width="26" height="26">
        <circle class="base-toast__info-pulse" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35" />
        <circle cx="12" cy="7" r="1.35" fill="currentColor" class="base-toast__info-dot" />
        <path d="M12 10.5 v7 M12 17.8 v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
      </svg>

      <!-- Danger: alert triangle + shake -->
      <svg v-else class="base-toast__svg base-toast__svg--danger" viewBox="0 0 24 24" width="26" height="26">
        <path
          class="base-toast__danger-triangle"
          d="M12 4.5 L20.5 18.5 H3.5 Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
        />
        <path class="base-toast__danger-bar" d="M12 9.5 v5.2 M12 16.8 v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>

    <p class="base-toast__text">{{ message }}</p>

    <button type="button" class="base-toast__close" aria-label="Dismiss" @click="$emit('dismiss')">
      <Icon name="lucide:x" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ToastVariant } from '~/composables/useToast';

defineProps<{
  variant: ToastVariant;
  message: string;
}>();

defineEmits<{
  dismiss: [];
}>();
</script>

<style scoped>
.base-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: min(100%, 26rem);
  padding: 0.875rem 0.75rem 0.875rem 1rem;
  border-radius: var(--card-radius);
  border: 1px solid var(--toast-border, var(--color-border));
  background: var(--toast-bg, var(--color-surface-card));
  box-shadow: var(--card-shadow-hover);
  font-size: var(--paragraph-size-small);
  line-height: var(--line-height-body);
  color: var(--toast-color, var(--color-text-primary));
}

.base-toast--success {
  --toast-bg: var(--color-success-muted);
  --toast-border: rgba(0, 166, 81, 0.28);
  --toast-color: #036835;
}

.base-toast--success .base-toast__icon {
  color: var(--color-success);
}

.base-toast--info {
  --toast-bg: var(--color-info-muted);
  --toast-border: rgba(27, 58, 92, 0.2);
  --toast-color: var(--color-brand-secondary);
}

.base-toast--info .base-toast__icon {
  color: var(--color-info);
}

.base-toast--danger {
  --toast-bg: var(--color-error-muted);
  --toast-border: rgba(197, 48, 48, 0.35);
  --toast-color: var(--color-error);
}

.base-toast--danger .base-toast__icon {
  color: var(--color-error);
}

.base-toast__icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.base-toast__svg {
  display: block;
}

.base-toast__success-ring {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: toast-ring-in 0.55s ease forwards;
}

.base-toast__success-check {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: toast-check-in 0.4s ease 0.35s forwards;
}

@keyframes toast-ring-in {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes toast-check-in {
  to {
    stroke-dashoffset: 0;
  }
}

.base-toast__svg--info .base-toast__info-pulse {
  transform-origin: 12px 12px;
  animation: toast-info-pulse 1.6s ease-in-out infinite;
}

.base-toast__info-dot {
  animation: toast-info-dot 1.6s ease-in-out infinite;
}

@keyframes toast-info-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.35;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.55;
  }
}

@keyframes toast-info-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
}

.base-toast__svg--danger {
  animation: toast-danger-shake 0.42s ease;
}

@keyframes toast-danger-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-3px);
  }
  40% {
    transform: translateX(3px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
}

.base-toast__danger-bar {
  animation: toast-danger-bar 0.5s ease 0.15s both;
}

@keyframes toast-danger-bar {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.base-toast__text {
  margin: 0;
  flex: 1;
  min-width: 0;
  padding-top: 0.05rem;
}

.base-toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: -0.2rem -0.15rem -0.2rem 0;
  border: none;
  border-radius: var(--button-radius);
  background: transparent;
  color: inherit;
  opacity: 0.55;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
}

.base-toast__close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.06);
}

.base-toast__close svg {
  width: 16px;
  height: 16px;
}
</style>
