<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="back-modal-title" :title="editingBack ? 'Edit back' : 'New back'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="back-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField label="Image" spaced>
          <div class="back-image-row">
            <div class="back-image-preview">
              <img v-if="modalImagePreview" :src="modalImagePreview" alt="" class="back-image-preview__img" />
              <div v-else class="back-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="back-image-actions">
              <input ref="imageFileInputRef" type="file" accept="image/*" class="visually-hidden" tabindex="-1" aria-hidden="true" @change="onImageFile" />
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving || uploadingImage" :loading="uploadingImage" @click="imageFileInputRef?.click()">
                {{ uploadingImage ? 'Uploading…' : 'Upload' }}
              </BaseButton>
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving" @click="openMediaPicker"> From library </BaseButton>
              <BaseButton v-if="canRemoveImage" type="button" variant="text" danger size="sm" :disabled="formSaving" @click="clearImage"> Remove </BaseButton>
            </div>
          </div>
        </BaseInputField>
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

    <ModalMedia v-model="mediaPickerOpen" @select="onMediaPickerSelect" />
  </div>
</template>

<script setup lang="ts">
import type { MediaPickerFile } from './Media.vue';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createBack, parseUploadResponseId, updateBack, uploadMedia, type Back } from '../../services';

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
const imageFileInputRef = ref<HTMLInputElement | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);
const imagePreviewUrlOverride = ref<string | null>(null);
let blobPreviewUrl: string | null = null;

const uploadingImage = ref(false);
const mediaPickerOpen = ref(false);

const modalImagePreview = computed(() => {
  if (imagePreviewUrlOverride.value) {
    return imagePreviewUrlOverride.value;
  }
  if (formImageTouched.value && formImageId.value === null) {
    return null;
  }
  const row = editingBack.value;
  if (row && !formImageTouched.value) {
    return extractPlinthImage(row, strapiPublicUrl.value).src;
  }
  return null;
});

function backImageId(row: BackModalRow): number | null {
  return extractPlinthImage(row, strapiPublicUrl.value).id;
}

const canRemoveImage = computed(() => {
  if (modalImagePreview.value) return true;
  const row = editingBack.value;
  if (row && !formImageTouched.value) {
    return backImageId(row) != null;
  }
  return false;
});

function revokeBlobPreview() {
  if (blobPreviewUrl) {
    URL.revokeObjectURL(blobPreviewUrl);
    if (imagePreviewUrlOverride.value === blobPreviewUrl) {
      imagePreviewUrlOverride.value = null;
    }
    blobPreviewUrl = null;
  }
}

function setBlobPreview(file: File) {
  revokeBlobPreview();
  blobPreviewUrl = URL.createObjectURL(file);
  imagePreviewUrlOverride.value = blobPreviewUrl;
}

function resetImageFormState() {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  formImageId.value = null;
  formImageTouched.value = false;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
}

async function onImageFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    formError.value = 'Please choose an image file.';
    input.value = '';
    return;
  }
  formError.value = '';
  uploadingImage.value = true;
  try {
    const fd = new FormData();
    fd.append('files', file);
    const raw = await uploadMedia(fd);
    const first = parseUploadResponseId(raw);
    if (!first) {
      formError.value = 'Upload did not return a file id.';
      return;
    }
    formImageId.value = first.id;
    formImageTouched.value = true;
    setBlobPreview(file);
  } catch {
    formError.value = 'Upload failed.';
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
}

function clearImage() {
  formImageId.value = null;
  formImageTouched.value = true;
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
}

function openMediaPicker() {
  if (formSaving.value) return;
  mediaPickerOpen.value = true;
}

function onMediaPickerSelect(f: MediaPickerFile) {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = f.thumbnail || f.url;
  formImageId.value = f.id;
  formImageTouched.value = true;
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
  mediaPickerOpen.value = false;
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
      if (mediaPickerOpen.value) {
        mediaPickerOpen.value = false;
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

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.back-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .back-image-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.back-image-preview {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.back-image-preview__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-small);
  text-align: center;
}

.back-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.back-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
