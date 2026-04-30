<template>
  <div>
    <BaseModal
      v-model="modalOpen"
      title-id="worktop-modal-title"
      :title="editingRow ? 'Edit worktop' : 'New worktop'"
      size="medium"
      :close-disabled="formSaving"
      :close-on-backdrop="!formSaving"
    >
      <form id="worktop-modal-form" @submit.prevent="submitModal">
        <BaseInputField
          ref="nameInputRef"
          v-model="formName"
          label="Name"
          required-mark
          type="text"
          name="name"
          autocomplete="off"
          maxlength="255"
          required
          :disabled="formSaving"
        />
        <BaseImageUpload
          ref="imageFieldRef"
          v-model:image-id="formImageId"
          v-model:image-touched="formImageTouched"
          :row-preview-url="rowImage.src"
          :row-image-id="rowImage.id"
          :disabled="formSaving"
          @error="onImageFieldError"
        />
        <BaseInputField v-model="formCode" label="Code" spaced type="text" name="code" maxlength="255" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField v-model="formNote" label="Note" spaced type="text" name="note" maxlength="2000" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField
          v-model="formDescription"
          label="Description"
          spaced
          type="text"
          name="description"
          maxlength="2000"
          placeholder="Optional"
          :disabled="formSaving"
        />
        <BaseInputField
          v-model="formPrice"
          label="Price (surcharge)"
          spaced
          type="text"
          name="price"
          inputmode="decimal"
          placeholder="Optional"
          :disabled="formSaving"
        />
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="worktop-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createWorktop, updateWorktop, type Worktop } from '../../services';

export type WorktopModalRow = Worktop;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const toast = useToast();

const modalOpen = ref(false);
const editingRow = ref<WorktopModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formNote = ref('');
const formDescription = ref('');
const formPrice = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const rowImage = computed(() => {
  const row = editingRow.value;
  if (!row) return { src: null as string | null, id: null as number | null };
  const ex = extractPlinthImage(row, strapiPublicUrl.value);
  return { src: ex.src, id: ex.id };
});

function resetImageFormState() {
  imageFieldRef.value?.reset();
}

function onImageFieldError(message: string) {
  formError.value = message;
}

function openCreate() {
  editingRow.value = null;
  formName.value = '';
  formCode.value = '';
  formNote.value = '';
  formDescription.value = '';
  formPrice.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function priceToFormString(price: WorktopModalRow['price']): string {
  if (price == null) return '';
  if (typeof price === 'number' && Number.isFinite(price)) return String(price);
  if (typeof price === 'string') {
    const t = price.trim();
    return t === '' ? '' : t;
  }
  return '';
}

function openEdit(row: WorktopModalRow) {
  editingRow.value = row;
  formName.value = row.name;
  formCode.value = row.code?.trim() ? row.code : '';
  formNote.value = row.note?.trim() ? row.note : '';
  formDescription.value = row.description?.trim() ? row.description : '';
  formPrice.value = priceToFormString(row.price);
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editingRow.value = null;
  formName.value = '';
  formCode.value = '';
  formNote.value = '';
  formDescription.value = '';
  formPrice.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    code: String(formCode.value ?? '').trim() || null,
    note: String(formNote.value ?? '').trim() || null,
    description: String(formDescription.value ?? '').trim() || null,
  };

  const priceTrim = String(formPrice.value ?? '').trim();
  if (editingRow.value) {
    if (priceTrim === '') {
      body.price = null;
    } else {
      const n = Number(priceTrim);
      if (Number.isNaN(n)) {
        formError.value = 'Enter a valid price or leave empty.';
        return null;
      }
      body.price = n;
    }
  } else if (priceTrim !== '') {
    const n = Number(priceTrim);
    if (Number.isNaN(n)) {
      formError.value = 'Enter a valid price or leave empty.';
      return null;
    }
    body.price = n;
  }

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingRow.value === null;
  formSaving.value = true;
  try {
    if (editingRow.value) {
      await updateWorktop(editingRow.value.documentId, body);
    } else {
      await createWorktop(body);
    }
    formSaving.value = false;
    toast.success(resetPage ? 'Worktop created.' : 'Worktop updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save worktop.');
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
      if (e.key !== 'Escape' || formSaving.value) return;
      if (imageFieldRef.value?.attemptCloseMediaPicker()) {
        return;
      }
      closeModal();
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
