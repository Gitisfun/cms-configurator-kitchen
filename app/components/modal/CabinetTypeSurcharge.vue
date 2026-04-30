<template>
  <BaseModal
    v-model="modalOpen"
    title-id="cabinet-type-surcharge-modal-title"
    :title="editing ? 'Edit type surcharge' : 'New type surcharge'"
    size="medium"
    :close-disabled="formSaving"
    :close-on-backdrop="!formSaving"
  >
    <form id="cabinet-type-surcharge-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formCode" label="Code" required-mark type="text" name="code" autocomplete="off" maxlength="255" required :disabled="formSaving" spaced />

      <div class="cts-modal__field cts-modal__field--spaced">
        <span class="cts-modal__label">Dimension</span>
        <select v-model="formDimensionRaw" class="cts-modal__select cms-native-select" :disabled="formSaving">
          <option value="">— None —</option>
          <option value="height">Height</option>
          <option value="width">Width</option>
          <option value="depth">Depth</option>
        </select>
      </div>

      <BaseInputField
        v-model="formValue"
        label="Value size"
        type="number"
        name="value"
        step="0.01"
        min="0"
        :disabled="formSaving"
        spaced
      />

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="cabinet-type-surcharge-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import {
  createCabinetTypeSurcharge,
  updateCabinetTypeSurcharge,
  type CabinetTypeSurcharge,
} from '../../services/cabinet-type-surcharges';

export type CabinetTypeSurchargeModalRow = CabinetTypeSurcharge;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const toast = useToast();

const modalOpen = ref(false);
const editing = ref<CabinetTypeSurchargeModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formDimensionRaw = ref('');
const formValue = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

function openCreate() {
  editing.value = null;
  formName.value = '';
  formCode.value = '';
  formDimensionRaw.value = '';
  formValue.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetTypeSurchargeModalRow) {
  editing.value = row;
  formName.value = row.name;
  formCode.value = row.code;
  formDimensionRaw.value = row.dimension ?? '';
  formValue.value = row.value != null && row.value !== '' ? String(row.value) : '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  const code = formCode.value.trim();
  if (!code) {
    formError.value = 'Please enter a code.';
    return;
  }

  formError.value = '';
  const trimmedValue = formValue.value.trim();
  const body: Record<string, unknown> = {
    name,
    code,
    dimension: formDimensionRaw.value.trim() || null,
    value: trimmedValue === '' ? null : formValue.value,
  };

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetTypeSurcharge(editing.value.documentId, body);
    } else {
      await createCabinetTypeSurcharge(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    toast.success(resetPage ? 'Type surcharge created.' : 'Type surcharge updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save surcharge.');
    formError.value = msg;
    toast.danger(msg);
  } finally {
    formSaving.value = false;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
    escKeyHandler = null;
  }
  if (open) {
    escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formSaving.value) closeModal();
    };
    document.addEventListener('keydown', escKeyHandler);
  }
});

onUnmounted(() => {
  if (import.meta.client && escKeyHandler) document.removeEventListener('keydown', escKeyHandler);
});

defineExpose({ openCreate, openEdit });
</script>

<style scoped>
.cts-modal__field {
  display: flex;
  flex-direction: column;
}

.cts-modal__field--spaced {
  margin-top: 1rem;
}

.cts-modal__label {
  display: block;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin-bottom: 0.375rem;
}

.cts-modal__select {
  width: 100%;
  box-sizing: border-box;
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  padding-left: 0.75rem;
  padding-right: var(--cms-select-padding-end);
  padding-inline-end: var(--cms-select-padding-end);
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-surface-card);
}

.cts-modal__select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.cts-modal__select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
