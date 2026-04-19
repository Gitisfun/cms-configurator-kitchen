<template>
  <BaseModal v-model="modalOpen" title-id="cabinet-variant-modal-title" :title="editing ? 'Edit cabinet variant' : 'New cabinet variant'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="cabinet-variant-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="orderNumberInputRef" v-model="formOrderNumber" label="Order number" required-mark type="text" name="orderNumber" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formWidth" label="Width (mm)" required-mark type="number" name="width" min="1" step="1" required :disabled="formSaving" spaced />
      <BaseInputField
        v-if="!lockVariantHeight"
        v-model="formHeight"
        label="Height (mm)"
        type="number"
        name="height"
        min="1"
        step="1"
        :disabled="formSaving"
        spaced
      />

      <div class="cv-modal__field cv-modal__field--spaced">
        <label class="cv-modal__checkbox-label">
          <input v-model="formIsVariableWidth" type="checkbox" :disabled="formSaving" />
          <span>Variable width</span>
        </label>
      </div>

      <template v-if="formIsVariableWidth">
        <BaseInputField v-model="formMinWidth" label="Min width (mm)" type="number" name="minWidth" min="1" step="1" :disabled="formSaving" spaced />
        <BaseInputField v-model="formMaxWidth" label="Max width (mm)" type="number" name="maxWidth" min="1" step="1" :disabled="formSaving" spaced />
      </template>

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="cabinet-variant-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createCabinetVariant, updateCabinetVariant, type CabinetVariant } from '../../services/cabinet-variants';

export type CabinetVariantModalRow = CabinetVariant;

export type CabinetVariantModalOpenOptions = {
  /** When true, hide height field and persist height as null. */
  lockVariantHeight?: boolean;
};

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editing = ref<CabinetVariantModalRow | null>(null);
const formOrderNumber = ref('');
const formWidth = ref('');
const formHeight = ref('');
const formIsVariableWidth = ref(false);
const formMinWidth = ref('');
const formMaxWidth = ref('');
const formError = ref('');
const formSaving = ref(false);
const orderNumberInputRef = ref<{ focus: () => void } | null>(null);

/** Set only when opening create via `openCreateForType` (catalog or admin page picker). */
const createCabinetTypeNumericId = ref<number | null>(null);

/** When true (e.g. cabinet series has a fixed carcase height), height is omitted and cleared on save. */
const lockVariantHeight = ref(false);

function resetFormFields() {
  formOrderNumber.value = '';
  formWidth.value = '';
  formHeight.value = '';
  formIsVariableWidth.value = false;
  formMinWidth.value = '';
  formMaxWidth.value = '';
  formError.value = '';
}

/** Pre-select cabinet type (numeric Strapi id) when creating from the catalog or variants list. */
function openCreateForType(cabinetTypeNumericId: number, options?: CabinetVariantModalOpenOptions) {
  editing.value = null;
  createCabinetTypeNumericId.value = cabinetTypeNumericId;
  lockVariantHeight.value = !!options?.lockVariantHeight;
  resetFormFields();
  modalOpen.value = true;
  nextTick(() => orderNumberInputRef.value?.focus());
}

function openEdit(row: CabinetVariantModalRow, options?: CabinetVariantModalOpenOptions) {
  editing.value = row;
  createCabinetTypeNumericId.value = null;
  lockVariantHeight.value = !!options?.lockVariantHeight;
  formOrderNumber.value = row.orderNumber;
  formWidth.value = String(row.width);
  formHeight.value =
    lockVariantHeight.value ? '' : row.height != null ? String(row.height) : '';
  formIsVariableWidth.value = row.isVariableWidth;
  formMinWidth.value = row.minWidth != null ? String(row.minWidth) : '';
  formMaxWidth.value = row.maxWidth != null ? String(row.maxWidth) : '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => orderNumberInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  createCabinetTypeNumericId.value = null;
  lockVariantHeight.value = false;
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const orderNumber = formOrderNumber.value.trim();
  if (!orderNumber) { formError.value = 'Please enter an order number.'; return; }
  const width = Number(formWidth.value);
  if (!Number.isFinite(width) || width < 1) { formError.value = 'Please enter a valid width.'; return; }

  if (!editing.value && createCabinetTypeNumericId.value == null) {
    formError.value = 'Missing cabinet type. Close this dialog and choose a cabinet type before adding a variant.';
    return;
  }

  formError.value = '';
  const body: Record<string, unknown> = {
    orderNumber,
    width,
    isVariableWidth: formIsVariableWidth.value,
  };

  if (lockVariantHeight.value) {
    body.height = null;
  } else {
    const heightRaw = String(formHeight.value ?? '').trim();
    if (heightRaw) {
      const h = Number(heightRaw);
      if (!Number.isFinite(h) || h < 1) {
        formError.value = 'Please enter a valid height or leave it empty.';
        return;
      }
      body.height = h;
    } else {
      body.height = null;
    }
  }

  if (formIsVariableWidth.value) {
    const min = String(formMinWidth.value ?? '').trim();
    body.minWidth = min ? Number(min) : null;
    const max = String(formMaxWidth.value ?? '').trim();
    body.maxWidth = max ? Number(max) : null;
  } else {
    body.minWidth = null;
    body.maxWidth = null;
  }

  if (!editing.value) {
    body.cabinetTypeId = createCabinetTypeNumericId.value;
  }

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetVariant(editing.value.documentId, body);
    } else {
      await createCabinetVariant(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save cabinet variant.');
  } finally {
    formSaving.value = false;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) { document.removeEventListener('keydown', escKeyHandler); escKeyHandler = null; }
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

defineExpose({ openCreateForType, openEdit });
</script>

<style scoped>
.cv-modal__field--spaced {
  margin-top: 1rem;
}

.cv-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-primary);
  cursor: pointer;
}

.cv-modal__checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}
</style>
