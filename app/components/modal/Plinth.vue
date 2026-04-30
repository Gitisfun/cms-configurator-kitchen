<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="plinth-modal-title" :title="editingPlinth ? 'Edit plinth' : 'New plinth'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="plinth-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField v-model="formCode" label="Code" spaced type="text" name="code" autocomplete="off" maxlength="255" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField v-model="formPrice" label="Price" spaced type="text" name="price" inputmode="decimal" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField v-model="formColor" label="Color" spaced type="text" name="color" maxlength="255" placeholder="Optional" :disabled="formSaving" />
        <BaseImageUpload
          ref="imageFieldRef"
          v-model:image-id="formImageId"
          v-model:image-touched="formImageTouched"
          :row-preview-url="rowImage.src"
          :row-image-id="rowImage.id"
          :disabled="formSaving"
          @error="onImageFieldError"
        />
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="plinth-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createPlinth, updatePlinth, type Plinth } from '../../services';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';

export type PlinthModalRow = Plinth;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const toast = useToast();

const modalOpen = ref(false);
const editingPlinth = ref<PlinthModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formPrice = ref('');
const formColor = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const rowImage = computed(() => {
  const row = editingPlinth.value;
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
  editingPlinth.value = null;
  formName.value = '';
  formCode.value = '';
  formPrice.value = '';
  formColor.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function priceToFormString(price: PlinthModalRow['price']): string {
  if (price == null) return '';
  if (typeof price === 'number' && Number.isFinite(price)) return String(price);
  if (typeof price === 'string') {
    const t = price.trim();
    return t === '' ? '' : t;
  }
  return '';
}

function openEdit(p: PlinthModalRow) {
  editingPlinth.value = p;
  formName.value = p.name;
  formCode.value = p.code?.trim() ? p.code : '';
  formPrice.value = priceToFormString(p.price);
  formColor.value = p.color ?? '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editingPlinth.value = null;
  formName.value = '';
  formCode.value = '';
  formPrice.value = '';
  formColor.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }
  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    code: formCode.value.trim() || null,
  };
  const priceTrim = formPrice.value.trim();

  if (editingPlinth.value) {
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
    body.color = formColor.value.trim() || null;
  } else {
    if (priceTrim !== '') {
      const n = Number(priceTrim);
      if (Number.isNaN(n)) {
        formError.value = 'Enter a valid price or leave empty.';
        return null;
      }
      body.price = n;
    }
    const c = formColor.value.trim();
    if (c) body.color = c;
  }

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingPlinth.value === null;
  formSaving.value = true;
  try {
    const wasEdit = editingPlinth.value !== null;
    if (editingPlinth.value) {
      await updatePlinth(editingPlinth.value.documentId, body);
    } else {
      await createPlinth(body);
    }
    formSaving.value = false;
    toast.success(wasEdit ? 'Plinth updated.' : 'Plinth created.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save plinth.');
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
