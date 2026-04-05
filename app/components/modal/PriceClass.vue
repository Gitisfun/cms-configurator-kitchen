<template>
  <BaseModal v-model="modalOpen" title-id="price-class-modal-title" :title="editingRow ? 'Edit price class' : 'New price class'" size="narrow" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="price-class-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField ref="levelInputRef" v-model="formLevel" label="Level" type="number" name="level" inputmode="numeric" min="0" max="1000000" step="1" required :disabled="formSaving" />
      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="price-class-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createPriceClass, updatePriceClass, type PriceClass } from '../../services/price-classes';

export type PriceClassModalRow = PriceClass;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editingRow = ref<PriceClassModalRow | null>(null);
const formName = ref('');
const formLevel = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const levelInputRef = ref<{ focus: () => void } | null>(null);

function openCreate() {
  editingRow.value = null;
  formName.value = '';
  formLevel.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: PriceClassModalRow) {
  editingRow.value = row;
  formName.value = row.name;
  formLevel.value = String(row.level);
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editingRow.value = null;
  formName.value = '';
  formLevel.value = '';
  formError.value = '';
}

function parseLevelInput(): number | null {
  const t = String(formLevel.value ?? '').trim();
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
    return null;
  }
  return n;
}

async function submitModal() {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  const level = parseLevelInput();
  if (level === null) {
    formError.value = 'Level must be a whole number between 0 and 1,000,000.';
    nextTick(() => levelInputRef.value?.focus());
    return;
  }
  formError.value = '';
  formSaving.value = true;
  try {
    if (editingRow.value) {
      await updatePriceClass(editingRow.value.documentId, { name, level });
    } else {
      await createPriceClass({ name, level });
    }
    const resetPage = editingRow.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save price class.');
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
  if (import.meta.client && escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
  }
});

defineExpose({ openCreate, openEdit });
</script>
