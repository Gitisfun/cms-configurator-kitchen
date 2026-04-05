<template>
  <div>
    <BaseModal
      v-model="modalOpen"
      title-id="plinth-modal-title"
      :title="editingPlinth ? 'Edit plinth' : 'New plinth'"
      size="medium"
      :close-disabled="formSaving"
      :close-on-backdrop="!formSaving"
    >
      <form id="plinth-modal-form" @submit.prevent="submitModal">
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
        <BaseInputField
          v-model="formPrice"
          label="Price"
          spaced
          type="text"
          name="price"
          inputmode="decimal"
          placeholder="Optional"
          :disabled="formSaving"
        />
        <BaseInputField
          v-model="formColor"
          label="Color"
          spaced
          type="text"
          name="color"
          maxlength="255"
          placeholder="Optional"
          :disabled="formSaving"
        />
        <BaseInputField label="Image" spaced>
          <div class="plinth-image-row">
            <div class="plinth-image-preview">
              <img
                v-if="modalImagePreview"
                :src="modalImagePreview"
                alt=""
                class="plinth-image-preview__img"
              />
              <div v-else class="plinth-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="plinth-image-actions">
              <input
                ref="imageFileInputRef"
                type="file"
                accept="image/*"
                class="visually-hidden"
                tabindex="-1"
                aria-hidden="true"
                @change="onPlinthImageFile"
              />
              <BaseButton
                type="button"
                variant="outlined"
                size="sm"
                :disabled="formSaving || uploadingImage"
                :loading="uploadingImage"
                @click="imageFileInputRef?.click()"
              >
                {{ uploadingImage ? 'Uploading…' : 'Upload' }}
              </BaseButton>
              <BaseButton
                type="button"
                variant="outlined"
                size="sm"
                :disabled="formSaving"
                @click="openMediaPicker"
              >
                From library
              </BaseButton>
              <BaseButton
                v-if="canRemovePlinthImage"
                type="button"
                variant="text"
                danger
                size="sm"
                :disabled="formSaving"
                @click="clearPlinthImage"
              >
                Remove
              </BaseButton>
            </div>
          </div>
        </BaseInputField>
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton
          type="button"
          variant="outlined"
          :disabled="formSaving"
          @click="closeModal"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          form="plinth-modal-form"
          variant="primary"
          :disabled="formSaving"
          :loading="formSaving"
        >
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
import {
  createPlinth,
  parseUploadResponseId,
  updatePlinth,
  uploadMedia,
  type Plinth,
} from '../../utils/service';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';

export type PlinthModalRow = Plinth;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editingPlinth = ref<PlinthModalRow | null>(null);
const formName = ref('');
const formPrice = ref('');
const formColor = ref('');
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
  const ep = editingPlinth.value;
  if (ep && !formImageTouched.value) {
    return extractPlinthImage(ep, strapiPublicUrl.value).src;
  }
  return null;
});

function plinthImageId(p: PlinthModalRow): number | null {
  return extractPlinthImage(p, strapiPublicUrl.value).id;
}

const canRemovePlinthImage = computed(() => {
  if (modalImagePreview.value) return true;
  const ep = editingPlinth.value;
  if (ep && !formImageTouched.value) {
    return plinthImageId(ep) != null;
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

async function onPlinthImageFile(e: Event) {
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

function clearPlinthImage() {
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
  editingPlinth.value = null;
  formName.value = '';
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
  formPrice.value = priceToFormString(p.price);
  formColor.value = p.color ?? '';
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
  editingPlinth.value = null;
  formName.value = '';
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
  const body: Record<string, unknown> = { name };
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
    if (editingPlinth.value) {
      await updatePlinth(editingPlinth.value.documentId, body);
    } else {
      await createPlinth(body);
    }
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save plinth.');
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

.plinth-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .plinth-image-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.plinth-image-preview {
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

.plinth-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.plinth-image-preview__placeholder {
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

.plinth-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.plinth-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
