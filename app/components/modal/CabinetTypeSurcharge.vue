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
      <BaseInputField v-model="formPrice" label="Price" required-mark type="number" name="price" step="0.01" min="0" required :disabled="formSaving" spaced />

      <div class="cts-modal__field cts-modal__field--spaced">
        <span class="cts-modal__label">Cabinet type</span>
        <select v-model="formCabinetTypeIdRaw" class="cts-modal__select" :disabled="formSaving || typesLoading" required>
          <option value="">— Select type —</option>
          <option v-for="t in typeOptions" :key="t.documentId" :value="String(t.id)">
            {{ t.name }}
          </option>
        </select>
      </div>

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
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import { getAllCabinetTypes, type CabinetType } from '../../services/cabinet-types';
import {
  createCabinetTypeSurcharge,
  updateCabinetTypeSurcharge,
  type CabinetTypeSurcharge,
} from '../../services/cabinet-type-surcharges';

export type CabinetTypeSurchargeModalRow = CabinetTypeSurcharge;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editing = ref<CabinetTypeSurchargeModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formPrice = ref('');
const formCabinetTypeIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

const typeOptions = ref<CabinetType[]>([]);
const typesLoading = ref(false);

async function loadTypesIfNeeded() {
  if (typeOptions.value.length > 0 || typesLoading.value) return;
  typesLoading.value = true;
  try {
    typeOptions.value = (await getAllCabinetTypes(1, 500)).data;
  } catch {
    typeOptions.value = [];
  } finally {
    typesLoading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formCode.value = '';
  formPrice.value = '';
  formCabinetTypeIdRaw.value = '';
  formError.value = '';
  modalOpen.value = true;
  void loadTypesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetTypeSurchargeModalRow) {
  editing.value = row;
  formName.value = row.name;
  formCode.value = row.code;
  formPrice.value = String(row.price ?? '');
  const tid = extractRelationNumericId(row.cabinetType);
  formCabinetTypeIdRaw.value = tid != null ? String(tid) : '';
  formError.value = '';
  modalOpen.value = true;
  void loadTypesIfNeeded();
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
  const rawT = formCabinetTypeIdRaw.value.trim();
  if (!rawT) {
    formError.value = 'Please select a cabinet type.';
    return;
  }
  const cabinetTypeId = Number(rawT);
  if (!Number.isFinite(cabinetTypeId) || cabinetTypeId <= 0) {
    formError.value = 'Invalid cabinet type.';
    return;
  }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    code,
    price: formPrice.value,
    cabinetTypeId,
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
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save surcharge.');
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
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
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
