<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="back-modal-title" :title="editingBack ? 'Edit back' : 'New back'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="back-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseImageUpload
          ref="imageFieldRef"
          v-model:image-id="formImageId"
          v-model:image-touched="formImageTouched"
          :row-preview-url="rowImage.src"
          :row-image-id="rowImage.id"
          :disabled="formSaving"
          @error="onImageFieldError"
        />
        <BaseInputField v-model="formColor" label="Color" spaced type="text" name="color" maxlength="255" placeholder="Default: white" :disabled="formSaving" />
        <BaseInputField v-model="formPrice" label="Price" spaced type="text" name="price" inputmode="decimal" placeholder="Optional" :disabled="formSaving" />
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="back-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
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
import { createBack, updateBack, type Back } from '../../services';

export type BackModalRow = Back;

const DEFAULT_COLOR = 'white';

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editingBack = ref<BackModalRow | null>(null);
const formName = ref('');
const formPrice = ref('');
const formColor = ref(DEFAULT_COLOR);
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const rowImage = computed(() => {
  const row = editingBack.value;
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
  editingBack.value = null;
  formName.value = '';
  formPrice.value = '';
  formColor.value = DEFAULT_COLOR;
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function priceToFormString(price: BackModalRow['price']): string {
  if (price == null) return '';
  if (typeof price === 'number' && Number.isFinite(price)) return String(price);
  if (typeof price === 'string') {
    const t = price.trim();
    return t === '' ? '' : t;
  }
  return '';
}

function openEdit(row: BackModalRow) {
  editingBack.value = row;
  formName.value = row.name;
  formPrice.value = priceToFormString(row.price);
  formColor.value = row.color?.trim() ? row.color : DEFAULT_COLOR;
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editingBack.value = null;
  formName.value = '';
  formPrice.value = '';
  formColor.value = DEFAULT_COLOR;
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
    color: String(formColor.value ?? '').trim() || DEFAULT_COLOR,
  };
  const priceTrim = String(formPrice.value ?? '').trim();

  if (editingBack.value) {
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

  const resetPage = editingBack.value === null;
  formSaving.value = true;
  try {
    if (editingBack.value) {
      await updateBack(editingBack.value.documentId, body);
    } else {
      await createBack(body);
    }
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save back.');
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

