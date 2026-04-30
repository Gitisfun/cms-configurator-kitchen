<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast-slide" tag="div" class="toast-host__list">
      <BaseToast
        v-for="t in toastItems"
        :key="t.id"
        :variant="t.variant"
        :message="t.message"
        @dismiss="dismissToast(t.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ToastItem } from '~/composables/useToast';
import { dismissToast } from '~/composables/useToast';

const toast = useToast();
const toastItems = computed<ToastItem[]>(() => (Array.isArray(toast.items.value) ? toast.items.value : []));
</script>

<style scoped>
.toast-host {
  position: fixed;
  bottom: max(1rem, env(safe-area-inset-bottom));
  right: max(1rem, env(safe-area-inset-right));
  z-index: 9999;
  pointer-events: none;
  max-width: calc(100vw - 2rem);
}

.toast-host__list {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 0.5rem;
}

.toast-host :deep(.base-toast) {
  pointer-events: auto;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.28s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(110%);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(40%);
}

.toast-slide-leave-active {
  position: absolute;
  right: 0;
}

.toast-slide-move {
  transition: transform 0.28s ease;
}
</style>
