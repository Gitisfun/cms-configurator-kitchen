<template>
  <BaseInputField :label="label" :spaced="spaced" :use-label-wrapper="false">
    <div class="image-upload-row">
      <div class="image-upload-preview">
        <img
          v-if="displayPreview"
          :src="displayPreview"
          alt=""
          class="image-upload-preview__img"
          loading="lazy"
        />
        <div v-else class="image-upload-preview__placeholder">
          <Icon name="lucide:image" />
          <span>No image</span>
        </div>
      </div>
      <div class="image-upload-actions">
        <input
          ref="imageFileInputRef"
          type="file"
          accept="image/*"
          class="visually-hidden"
          tabindex="-1"
          aria-hidden="true"
          @change="onImageFile"
        />
        <BaseButton
          type="button"
          variant="outlined"
          size="sm"
          :disabled="disabled || uploadingImage"
          :loading="uploadingImage"
          @click="imageFileInputRef?.click()"
        >
          {{ uploadingImage ? 'Uploading…' : 'Upload' }}
        </BaseButton>
        <BaseButton type="button" variant="outlined" size="sm" :disabled="disabled" @click="openMediaPicker">
          From library
        </BaseButton>
        <BaseButton
          v-if="canRemoveImage"
          type="button"
          variant="text"
          danger
          size="sm"
          :disabled="disabled"
          @click="clearImage"
        >
          Remove
        </BaseButton>
      </div>
    </div>
  </BaseInputField>

  <ModalMedia v-model="mediaPickerOpen" @select="onMediaPickerSelect" />
</template>

<script setup lang="ts">
import type { MediaPickerFile } from '../modal/Media.vue';
import { parseUploadResponseId, uploadMedia } from '../../services/upload';

const imageId = defineModel<number | null>('imageId', { default: null });
const imageTouched = defineModel<boolean>('imageTouched', { default: false });

const props = withDefaults(
  defineProps<{
    /** Preview URL from the existing row when editing (e.g. from extractPlinthImage). */
    rowPreviewUrl?: string | null;
    /** Strapi media id from the existing row, if any. */
    rowImageId?: number | null;
    disabled?: boolean;
    label?: string;
    spaced?: boolean;
  }>(),
  {
    rowPreviewUrl: null,
    rowImageId: null,
    disabled: false,
    label: 'Image',
    spaced: true,
  },
);

const emit = defineEmits<{
  error: [message: string];
}>();

const imageFileInputRef = ref<HTMLInputElement | null>(null);
const imagePreviewUrlOverride = ref<string | null>(null);
let blobPreviewUrl: string | null = null;
const uploadingImage = ref(false);
const mediaPickerOpen = ref(false);

const displayPreview = computed(() => {
  if (imagePreviewUrlOverride.value) return imagePreviewUrlOverride.value;
  if (imageTouched.value && imageId.value === null) return null;
  if (!imageTouched.value && props.rowPreviewUrl) return props.rowPreviewUrl;
  return null;
});

const canRemoveImage = computed(() => {
  if (displayPreview.value) return true;
  if (!imageTouched.value && props.rowImageId != null) return true;
  return false;
});

function revokeBlobPreview() {
  if (blobPreviewUrl) {
    URL.revokeObjectURL(blobPreviewUrl);
    if (imagePreviewUrlOverride.value === blobPreviewUrl) imagePreviewUrlOverride.value = null;
    blobPreviewUrl = null;
  }
}

function setBlobPreview(file: File) {
  revokeBlobPreview();
  blobPreviewUrl = URL.createObjectURL(file);
  imagePreviewUrlOverride.value = blobPreviewUrl;
}

function reset() {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  imageId.value = null;
  imageTouched.value = false;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
  mediaPickerOpen.value = false;
}

function clearImage() {
  imageId.value = null;
  imageTouched.value = true;
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
}

function openMediaPicker() {
  if (props.disabled) return;
  mediaPickerOpen.value = true;
}

function onMediaPickerSelect(f: MediaPickerFile) {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = f.thumbnail || f.url;
  imageId.value = f.id;
  imageTouched.value = true;
}

async function onImageFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    emit('error', 'Please choose an image file.');
    input.value = '';
    return;
  }
  emit('error', '');
  uploadingImage.value = true;
  try {
    const fd = new FormData();
    fd.append('files', file);
    const raw = await uploadMedia(fd);
    const first = parseUploadResponseId(raw);
    if (!first) {
      emit('error', 'Upload did not return a file id.');
      return;
    }
    imageId.value = first.id;
    imageTouched.value = true;
    setBlobPreview(file);
  } catch {
    emit('error', 'Upload failed.');
  } finally {
    uploadingImage.value = false;
    input.value = '';
  }
}

/** Returns true if the media picker was open and was closed. */
function attemptCloseMediaPicker(): boolean {
  if (!mediaPickerOpen.value) return false;
  mediaPickerOpen.value = false;
  return true;
}

defineExpose({
  reset,
  attemptCloseMediaPicker,
});
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

.image-upload-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .image-upload-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.image-upload-preview {
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

.image-upload-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-upload-preview__placeholder {
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

.image-upload-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.image-upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
