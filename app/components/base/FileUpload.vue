<template>
  <div class="file-upload">
    <div
      class="dropzone"
      :class="{
        'dropzone--active': isDragging,
        'dropzone--has-files': stagedFiles.length > 0,
      }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="accept"
        class="dropzone__input"
        @change="onFileSelect"
      />

      <template v-if="stagedFiles.length === 0">
        <div class="dropzone__icon-wrap">
          <Icon name="lucide:cloud-upload" class="dropzone__icon" />
        </div>
        <p class="dropzone__title">{{ dropTitle }}</p>
        <p class="dropzone__hint">{{ dropHint }}</p>
      </template>
    </div>

    <div v-if="stagedFiles.length > 0" class="staged">
      <div class="staged__header">
        <h3 class="staged__title">
          {{ stagedFiles.length }} {{ stagedFiles.length === 1 ? 'file' : 'files' }} selected
        </h3>
        <div class="staged__actions">
          <BaseButton type="button" variant="outlined" @click="clearStaged">
            Cancel
          </BaseButton>
          <BaseButton
            type="button"
            :disabled="uploading"
            :loading="uploading"
            @click="uploadFiles"
          >
            <Icon v-if="!uploading" name="lucide:upload" class="base-btn__icon" />
            {{ uploading ? 'Uploading...' : 'Upload All' }}
          </BaseButton>
        </div>
      </div>

      <div class="staged__grid">
        <div
          v-for="(file, index) in stagedFiles"
          :key="index"
          class="staged__file"
        >
          <div class="staged__preview">
            <img
              v-if="file.preview"
              :src="file.preview"
              :alt="file.raw.name"
              class="staged__image"
            />
            <div v-else class="staged__file-icon">
              <Icon :name="getFileIcon(file.raw.name)" />
            </div>

            <button
              type="button"
              class="staged__remove"
              title="Remove file"
              @click.stop="removeStaged(index)"
            >
              <Icon name="lucide:x" />
            </button>

            <div v-if="file.status !== 'idle'" class="staged__overlay">
              <Icon
                v-if="file.status === 'success'"
                name="lucide:check-circle"
                class="staged__status-icon staged__status-icon--success"
              />
              <Icon
                v-else-if="file.status === 'error'"
                name="lucide:alert-circle"
                class="staged__status-icon staged__status-icon--error"
              />
              <span v-else class="staged__loader" />
            </div>
          </div>

          <p class="staged__name" :title="file.raw.name">{{ file.raw.name }}</p>
          <p class="staged__size">{{ formatSize(file.raw.size) }}</p>
        </div>
      </div>
    </div>

    <BaseMessage
      v-if="errorMessage"
      variant="error"
      @dismiss="errorMessage = ''"
    >
      {{ errorMessage }}
    </BaseMessage>

    <BaseMessage
      v-if="successMessage"
      variant="success"
      @dismiss="successMessage = ''"
    >
      {{ successMessage }}
    </BaseMessage>
  </div>
</template>

<script setup lang="ts">
import { uploadMedia } from '../../utils/service/upload';

interface StagedFile {
  raw: File;
  preview: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

const props = withDefaults(
  defineProps<{
    accept?: string;
    multiple?: boolean;
    uploadEndpoint?: string;
    dropTitle?: string;
    dropHint?: string;
  }>(),
  {
    accept: 'image/*,.glb,.gltf,.hdr',
    multiple: true,
    uploadEndpoint: '/api/upload',
    dropTitle: 'Drop files here or click to browse',
    dropHint: 'Supports images, GLB models, and HDR environments',
  },
);

const emit = defineEmits<{
  uploaded: [payload: { count: number }];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const stagedFiles = ref<StagedFile[]>([]);
const errorMessage = ref('');
const successMessage = ref('');

let dragCounter = 0;

function openFilePicker() {
  fileInput.value?.click();
}

function onDragEnter() {
  dragCounter++;
  isDragging.value = true;
}

function onDragOver() {
  isDragging.value = true;
}

function onDragLeave() {
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDragging.value = false;
  }
}

function onDrop(e: DragEvent) {
  dragCounter = 0;
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files) addFiles(files);
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) addFiles(target.files);
  target.value = '';
}

function addFiles(fileList: FileList) {
  for (const file of Array.from(fileList)) {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    stagedFiles.value.push({ raw: file, preview, status: 'idle' });
  }
}

function removeStaged(index: number) {
  const file = stagedFiles.value[index] as StagedFile | undefined;
  if (file?.preview) URL.revokeObjectURL(file.preview);
  stagedFiles.value.splice(index, 1);
}

function clearStaged() {
  for (const f of stagedFiles.value) {
    if (f.preview) URL.revokeObjectURL(f.preview);
  }
  stagedFiles.value = [];
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return 'lucide:box';
  if (ext === 'hdr') return 'lucide:sun';
  return 'lucide:file';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadFiles() {
  uploading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  let successCount = 0;
  let failCount = 0;

  for (const file of stagedFiles.value) {
    if (file.status === 'success') {
      successCount++;
      continue;
    }

    file.status = 'uploading';

    try {
      const formData = new FormData();
      formData.append('files', file.raw);

      await uploadMedia(formData, props.uploadEndpoint);

      file.status = 'success';
      successCount++;
    } catch {
      file.status = 'error';
      failCount++;
    }
  }

  uploading.value = false;

  if (failCount === 0) {
    successMessage.value = `${successCount} ${successCount === 1 ? 'file' : 'files'} uploaded successfully.`;
    emit('uploaded', { count: successCount });
    setTimeout(() => clearStaged(), 1500);
  } else {
    errorMessage.value = `${failCount} ${failCount === 1 ? 'file' : 'files'} failed to upload. You can retry.`;
  }
}

defineExpose({ openFilePicker });
</script>

<style scoped>
.file-upload {
  display: block;
}

.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 2rem;
  border: 2px dashed var(--color-border);
  border-radius: var(--card-radius);
  background: var(--color-surface-card);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.dropzone:hover {
  border-color: var(--color-brand);
  background: var(--color-surface-hover);
}

.dropzone--active {
  border-color: var(--color-brand);
  background: var(--color-success-muted);
}

.dropzone--has-files {
  padding: 1.5rem;
  border-style: solid;
  border-color: var(--color-border);
  cursor: default;
}

.dropzone__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.dropzone__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-info-muted);
}

.dropzone__icon {
  width: 28px;
  height: 28px;
  color: var(--color-text-muted);
}

.dropzone__title {
  font-size: var(--paragraph-size-medium);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.dropzone__hint {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.staged {
  margin-top: 1.5rem;
}

.staged__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.staged__title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
}

.staged__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.staged__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.staged__file {
  min-width: 0;
}

.staged__preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--button-radius);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.staged__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.staged__file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-muted-light);
  font-size: 32px;
}

.staged__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.staged__preview:hover .staged__remove {
  opacity: 1;
}

.staged__remove:hover {
  background: var(--color-error);
}

.staged__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
}

.staged__status-icon {
  width: 28px;
  height: 28px;
}

.staged__status-icon--success {
  color: var(--color-success);
}

.staged__status-icon--error {
  color: var(--color-error);
}

.staged__loader {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.staged__name {
  margin-top: 0.375rem;
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.staged__size {
  font-size: 12px;
  color: var(--color-text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .staged__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .staged__grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
