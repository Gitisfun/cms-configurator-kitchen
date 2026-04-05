<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="front-modal-title" :title="editingFront ? 'Edit front' : 'New front'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="front-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField label="Description" spaced>
          <textarea
            v-model="formDescription"
            class="front-modal__textarea"
            name="description"
            rows="4"
            maxlength="10000"
            placeholder="Optional"
            :disabled="formSaving"
          />
        </BaseInputField>
        <div class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label"> Price class </span>
          <select v-model="formPriceClassIdRaw" class="front-modal__select" :disabled="formSaving || priceClassesLoading">
            <option value="">— None —</option>
            <option v-for="pc in priceClassOptions" :key="pc.documentId" :value="String(pc.id)">
              {{ pc.name }} (level {{ pc.level }})
            </option>
          </select>
          <p v-if="priceClassLoadError" class="base-modal__error">{{ priceClassLoadError }}</p>
        </div>
        <BaseInputField label="Image" spaced>
          <div class="front-image-row">
            <div class="front-image-preview">
              <img v-if="modalImagePreview" :src="modalImagePreview" alt="" class="front-image-preview__img" />
              <div v-else class="front-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="front-image-actions">
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
        <BaseButton type="submit" form="front-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
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
import { extractFrontPriceClass } from '../../utils/frontPriceClass';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createFront, getAllPriceClasses, parseUploadResponseId, updateFront, uploadMedia, type Front } from '../../services';
import type { PriceClass } from '../../services/price-classes';

export type FrontModalRow = Front;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editingFront = ref<FrontModalRow | null>(null);
const formName = ref('');
const formDescription = ref('');
const formPriceClassIdRaw = ref('');
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

const priceClassOptions = ref<PriceClass[]>([]);
const priceClassesLoading = ref(false);
const priceClassLoadError = ref('');

const modalImagePreview = computed(() => {
  if (imagePreviewUrlOverride.value) {
    return imagePreviewUrlOverride.value;
  }
  if (formImageTouched.value && formImageId.value === null) {
    return null;
  }
  const row = editingFront.value;
  if (row && !formImageTouched.value) {
    return extractPlinthImage(row, strapiPublicUrl.value).src;
  }
  return null;
});

function frontImageId(row: FrontModalRow): number | null {
  return extractPlinthImage(row, strapiPublicUrl.value).id;
}

const canRemoveImage = computed(() => {
  if (modalImagePreview.value) return true;
  const row = editingFront.value;
  if (row && !formImageTouched.value) {
    return frontImageId(row) != null;
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

async function loadPriceClassesIfNeeded() {
  if (priceClassOptions.value.length > 0 || priceClassesLoading.value) return;
  priceClassLoadError.value = '';
  priceClassesLoading.value = true;
  try {
    const res = await getAllPriceClasses(1, 200);
    priceClassOptions.value = res.data;
  } catch {
    priceClassLoadError.value = 'Could not load price classes.';
  } finally {
    priceClassesLoading.value = false;
  }
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
  editingFront.value = null;
  formName.value = '';
  formDescription.value = '';
  formPriceClassIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadPriceClassesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: FrontModalRow) {
  editingFront.value = row;
  formName.value = row.name;
  formDescription.value = row.description ?? '';
  const pc = extractFrontPriceClass(row);
  formPriceClassIdRaw.value = pc.id != null ? String(pc.id) : '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadPriceClassesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  mediaPickerOpen.value = false;
  resetImageFormState();
  modalOpen.value = false;
  editingFront.value = null;
  formName.value = '';
  formDescription.value = '';
  formPriceClassIdRaw.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }
  formError.value = '';
  const desc = String(formDescription.value ?? '').trim();
  const body: Record<string, unknown> = {
    name,
    description: desc || null,
  };

  const rawPc = formPriceClassIdRaw.value.trim();
  if (rawPc === '') {
    body.priceClassId = null;
  } else {
    const n = Number(rawPc);
    if (!Number.isInteger(n)) {
      formError.value = 'Choose a valid price class.';
      return null;
    }
    body.priceClassId = n;
  }

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingFront.value === null;
  formSaving.value = true;
  try {
    if (editingFront.value) {
      await updateFront(editingFront.value.documentId, body);
    } else {
      await createFront(body);
    }
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save front.');
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

.front-modal__field--spaced {
  margin-top: 1rem;
}

.front-modal__label {
  display: block;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin-bottom: 0.375rem;
}

.front-modal__select {
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

.front-modal__select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.front-modal__select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.front-modal__textarea {
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
  min-height: 5rem;
}

.front-modal__textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.front-modal__textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.front-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .front-image-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.front-image-preview {
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

.front-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.front-image-preview__placeholder {
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

.front-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.front-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
