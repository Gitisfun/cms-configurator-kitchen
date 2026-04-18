<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="cabinet-accessory-modal-title" :title="editing ? 'Edit accessory' : 'New accessory'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="cabinet-accessory-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField label="Description" spaced>
          <textarea
            v-model="formDescription"
            class="ca-modal__textarea"
            name="description"
            rows="3"
            maxlength="10000"
            placeholder="Optional"
            :disabled="formSaving"
          />
        </BaseInputField>
        <BaseInputField v-model="formPrice" label="Price" required-mark type="number" name="price" step="0.01" min="0" required :disabled="formSaving" spaced />

        <BaseInputField label="Image" spaced>
          <div class="ca-image-row">
            <div class="ca-image-preview">
              <img v-if="modalImagePreview" :src="modalImagePreview" alt="" class="ca-image-preview__img" loading="lazy" />
              <div v-else class="ca-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="ca-image-actions">
              <input ref="imageFileInputRef" type="file" accept="image/*" class="visually-hidden" tabindex="-1" aria-hidden="true" @change="onImageFile" />
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving || uploadingImage" :loading="uploadingImage" @click="imageFileInputRef?.click()">
                {{ uploadingImage ? 'Uploading…' : 'Upload' }}
              </BaseButton>
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving" @click="openMediaPicker"> From library </BaseButton>
              <BaseButton v-if="canRemoveImage" type="button" variant="text" danger size="sm" :disabled="formSaving" @click="clearImage"> Remove </BaseButton>
            </div>
          </div>
        </BaseInputField>

        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="cabinet-accessory-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
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
import { createCabinetAccessory, updateCabinetAccessory, type CabinetAccessory } from '../../services/cabinet-accessories';
import { uploadMedia, parseUploadResponseId } from '../../services/upload';

export type CabinetAccessoryModalRow = CabinetAccessory;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editing = ref<CabinetAccessoryModalRow | null>(null);
const formName = ref('');
const formDescription = ref('');
const formPrice = ref('');
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
  if (imagePreviewUrlOverride.value) return imagePreviewUrlOverride.value;
  if (formImageTouched.value && formImageId.value === null) return null;
  const row = editing.value;
  if (row && !formImageTouched.value) return extractPlinthImage(row, strapiPublicUrl.value).src;
  return null;
});

function rowImageId(row: CabinetAccessoryModalRow): number | null {
  return extractPlinthImage(row, strapiPublicUrl.value).id;
}

const canRemoveImage = computed(() => {
  if (modalImagePreview.value) return true;
  const row = editing.value;
  if (row && !formImageTouched.value) return rowImageId(row) != null;
  return false;
});

function revokeBlobPreview() {
  if (blobPreviewUrl) {
    URL.revokeObjectURL(blobPreviewUrl);
    if (imagePreviewUrlOverride.value === blobPreviewUrl) imagePreviewUrlOverride.value = null;
    blobPreviewUrl = null;
  }
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
    if (!first) { formError.value = 'Upload did not return a file id.'; return; }
    formImageId.value = first.id;
    formImageTouched.value = true;
    revokeBlobPreview();
    blobPreviewUrl = URL.createObjectURL(file);
    imagePreviewUrlOverride.value = blobPreviewUrl;
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
  editing.value = null;
  formName.value = '';
  formDescription.value = '';
  formPrice.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetAccessoryModalRow) {
  editing.value = row;
  formName.value = row.name;
  formDescription.value = row.description ?? '';
  formPrice.value = row.price != null ? String(row.price) : '';
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
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) { formError.value = 'Please enter a name.'; return; }
  const price = Number(formPrice.value);
  if (!Number.isFinite(price) || price < 0) { formError.value = 'Please enter a valid price.'; return; }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    description: formDescription.value.trim() || null,
    price,
  };

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetAccessory(editing.value.documentId, body);
    } else {
      await createCabinetAccessory(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save accessory.');
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
      if (mediaPickerOpen.value) { mediaPickerOpen.value = false; return; }
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

.ca-modal__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  resize: vertical;
  min-height: 4rem;
}

.ca-modal__textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.ca-modal__textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ca-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .ca-image-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.ca-image-preview {
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

.ca-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ca-image-preview__placeholder {
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

.ca-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.ca-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
