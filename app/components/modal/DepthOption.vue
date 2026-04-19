<template>
  <BaseModal v-model="modalOpen" title-id="depth-option-modal-title" :title="editing ? 'Edit depth option' : 'New depth option'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="depth-option-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formDepth" label="Depth (mm)" required-mark type="number" name="depth" min="1" step="1" required :disabled="formSaving" spaced />
      <BaseInputField v-model="formSurchargeCode" label="Surcharge code" type="text" name="surchargeCode" autocomplete="off" maxlength="255" :disabled="formSaving" spaced />
      <BaseInputField v-model="formSurchargeAmount" label="Surcharge amount" type="number" name="surchargeAmount" step="0.01" min="0" :disabled="formSaving" spaced />

      <div class="do-modal__field do-modal__field--spaced">
        <label class="do-modal__checkbox-label">
          <input v-model="formIsDefault" type="checkbox" :disabled="formSaving" />
          <span>Is default depth</span>
        </label>
      </div>

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="depth-option-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createDepthOption, updateDepthOption, type DepthOption } from '../../services/depth-options';

export type DepthOptionModalRow = DepthOption;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editing = ref<DepthOptionModalRow | null>(null);
const formName = ref('');
const formDepth = ref('');
const formSurchargeCode = ref('');
const formSurchargeAmount = ref('0');
const formIsDefault = ref(false);
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

/** When creating, optionally link to a cabinet type by its Strapi document id. */
const presetCabinetTypeDocumentId = ref<string | null>(null);

function resetForm() {
  formName.value = '';
  formDepth.value = '';
  formSurchargeCode.value = '';
  formSurchargeAmount.value = '0';
  formIsDefault.value = false;
  formError.value = '';
}

/**
 * Required by `useModal` / CRUD pattern. New depth options can be created from the depth options list
 * or with an optional cabinet-type link.
 */
function openCreate() {
  /* no-op */
}

/** Create a depth option and optionally connect it to a cabinet type (document id). */
function openCreateForCabinetType(cabinetTypeDocumentId: string) {
  editing.value = null;
  presetCabinetTypeDocumentId.value = cabinetTypeDocumentId.trim() || null;
  resetForm();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: DepthOptionModalRow) {
  editing.value = row;
  presetCabinetTypeDocumentId.value = null;
  formName.value = row.name;
  formDepth.value = String(row.depth);
  formSurchargeCode.value = row.surchargeCode ?? '';
  formSurchargeAmount.value = String(row.surchargeAmount ?? 0);
  formIsDefault.value = row.isDefault;
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editing.value = null;
  presetCabinetTypeDocumentId.value = null;
}

function buildBodyScalars(): Record<string, unknown> {
  const name = formName.value.trim();
  const depth = Number(formDepth.value);
  const body: Record<string, unknown> = { name, depth };
  body.surchargeCode = formSurchargeCode.value.trim() || null;
  const amt = formSurchargeAmount.value.trim();
  body.surchargeAmount = amt !== '' ? Number(amt) : 0;
  body.isDefault = formIsDefault.value;
  return body;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  const depth = Number(formDepth.value);
  if (!Number.isFinite(depth) || depth < 1) {
    formError.value = 'Please enter a valid depth.';
    return;
  }

  formError.value = '';

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateDepthOption(editing.value.documentId, buildBodyScalars());
    } else {
      const body = buildBodyScalars();
      const doc = presetCabinetTypeDocumentId.value?.trim();
      if (doc) body.connectCabinetTypeDocumentIds = [doc];
      await createDepthOption(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save depth option.');
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

defineExpose({ openCreate, openCreateForCabinetType, openEdit });
</script>

<style scoped>
.do-modal__field--spaced {
  margin-top: 1rem;
}

.do-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-primary);
  cursor: pointer;
}

.do-modal__checkbox-label input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
}
</style>
