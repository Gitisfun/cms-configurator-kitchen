<template>
  <BaseModal
    v-model="confirmDialogState.open"
    :title="confirmDialogState.title"
    title-id="cms-confirm-dialog-title"
    size="narrow"
    :overlay-z-index="340"
    :close-on-backdrop="true"
    @close="onDismiss"
  >
    <p class="confirm-dialog__message">{{ confirmDialogState.message }}</p>
    <template #footer>
      <BaseButton type="button" variant="outlined" @click="onCancel">
        {{ confirmDialogState.cancelLabel }}
      </BaseButton>
      <BaseButton
        type="button"
        variant="primary"
        class="confirm-dialog__confirm"
        :class="{ 'confirm-dialog__confirm--danger': confirmDialogState.danger }"
        @click="onConfirm"
      >
        {{ confirmDialogState.confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { confirmDialogState, settleConfirmDialog } from '~/composables/useConfirmDialog';

function onConfirm() {
  settleConfirmDialog(true);
}

function onCancel() {
  settleConfirmDialog(false);
}

function onDismiss() {
  settleConfirmDialog(false);
}
</script>

<style scoped>
.confirm-dialog__message {
  margin: 0;
  font-size: var(--paragraph-size-medium);
  line-height: var(--line-height-body);
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.confirm-dialog__confirm--danger {
  background: var(--color-error);
  color: #fff;
  box-shadow: none;
}

.confirm-dialog__confirm--danger:hover:not(:disabled) {
  background: #a52727;
  box-shadow: none;
}
</style>
