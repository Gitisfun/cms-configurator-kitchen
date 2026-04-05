<template>
  <div>
    <CmsPageHeader
      title="Media"
      description="Upload and manage images, 3D models, and other assets."
    >
      <template #actions>
        <button class="btn btn--primary" @click="openFilePicker">
          <Icon name="lucide:upload" class="btn__icon" />
          Upload Files
        </button>
      </template>
    </CmsPageHeader>

    <!-- Drop zone -->
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
        multiple
        accept="image/*,.glb,.gltf,.hdr"
        class="dropzone__input"
        @change="onFileSelect"
      />

      <template v-if="stagedFiles.length === 0">
        <div class="dropzone__icon-wrap">
          <Icon name="lucide:cloud-upload" class="dropzone__icon" />
        </div>
        <p class="dropzone__title">Drop files here or click to browse</p>
        <p class="dropzone__hint">Supports images, GLB models, and HDR environments</p>
      </template>
    </div>

    <!-- Staged files -->
    <div v-if="stagedFiles.length > 0" class="staged">
      <div class="staged__header">
        <h3 class="staged__title">
          {{ stagedFiles.length }} {{ stagedFiles.length === 1 ? 'file' : 'files' }} selected
        </h3>
        <div class="staged__actions">
          <button class="btn btn--outlined" @click="clearStaged">
            Cancel
          </button>
          <button
            class="btn btn--primary"
            :disabled="uploading"
            @click="uploadFiles"
          >
            <Icon v-if="!uploading" name="lucide:upload" class="btn__icon" />
            <span v-if="uploading" class="btn__spinner" />
            {{ uploading ? 'Uploading...' : 'Upload All' }}
          </button>
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
              class="staged__remove"
              title="Remove file"
              @click.stop="removeStaged(index)"
            >
              <Icon name="lucide:x" />
            </button>

            <!-- Upload progress overlay -->
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

    <!-- Error message -->
    <div v-if="errorMessage" class="upload-error">
      <Icon name="lucide:alert-triangle" class="upload-error__icon" />
      <span>{{ errorMessage }}</span>
      <button class="upload-error__close" @click="errorMessage = ''">
        <Icon name="lucide:x" />
      </button>
    </div>

    <!-- Success message -->
    <div v-if="successMessage" class="upload-success">
      <Icon name="lucide:check-circle" class="upload-success__icon" />
      <span>{{ successMessage }}</span>
      <button class="upload-success__close" @click="successMessage = ''">
        <Icon name="lucide:x" />
      </button>
    </div>

    <!-- Media Library -->
    <section class="library">
      <div class="library__header">
        <h3 class="library__title">Media Library</h3>
        <span v-if="mediaFiles.length || page > 1" class="library__count">
          {{ mediaFiles.length }} on this page
        </span>
      </div>

      <div v-if="loadingFiles" class="library__loading">
        <span class="library__spinner" />
        <span>Loading files&hellip;</span>
      </div>

      <div v-else-if="loadError" class="upload-error">
        <Icon name="lucide:alert-triangle" class="upload-error__icon" />
        <span>{{ loadError }}</span>
        <button class="btn btn--outlined btn--sm" @click="refresh()">Retry</button>
      </div>

      <CmsEmptyState
        v-else-if="mediaFiles.length === 0 && page === 1"
        title="No files yet"
        description="Upload your first files using the dropzone above."
        icon="lucide:image"
      />

      <template v-else-if="mediaFiles.length === 0 && page > 1">
        <p class="library__empty-page">No files on this page.</p>
        <button type="button" class="btn btn--outlined" @click="page = 1">
          Back to first page
        </button>
      </template>

      <div v-else class="library__grid">
        <div
          v-for="file in mediaFiles"
          :key="file.id"
          class="media-card"
        >
          <div class="media-card__preview">
            <img
              v-if="file.mime.startsWith('image/')"
              :src="file.thumbnail || file.url"
              :alt="file.alternativeText || file.name"
              class="media-card__image"
              loading="lazy"
            />
            <div v-else class="media-card__icon-wrap">
              <Icon :name="getFileIcon(file.name)" class="media-card__icon" />
            </div>
          </div>
          <div class="media-card__info">
            <p class="media-card__name" :title="file.name">{{ file.name }}</p>
            <p class="media-card__meta">
              {{ formatSize(file.size * 1024) }}
              <template v-if="file.width && file.height">
                &middot; {{ file.width }}&times;{{ file.height }}
              </template>
            </p>
          </div>
        </div>
      </div>

      <nav
        v-if="!loadError && !loadingFiles && (mediaFiles.length > 0 || hasPreviousPage || hasNextPage)"
        class="library__pager"
        aria-label="Media library pages"
      >
        <button
          type="button"
          class="btn btn--outlined"
          :disabled="!hasPreviousPage || loadingFiles"
          @click="page--"
        >
          <Icon name="lucide:chevron-left" class="btn__icon" />
          Previous
        </button>
        <span class="library__pager-info">Page {{ page }}</span>
        <button
          type="button"
          class="btn btn--outlined"
          :disabled="!hasNextPage || loadingFiles"
          @click="page++"
        >
          Next
          <Icon name="lucide:chevron-right" class="btn__icon" />
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup lang="ts">
interface StagedFile {
  raw: File;
  preview: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

interface MediaFile {
  id: number;
  name: string;
  alternativeText: string | null;
  ext: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  thumbnail: string | null;
  createdAt: string;
}

interface MediaFilesPage {
  data: MediaFile[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const MEDIA_PAGE_SIZE = 24;

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const stagedFiles = ref<StagedFile[]>([]);
const errorMessage = ref('');
const successMessage = ref('');
const page = ref(1);

const { data: mediaPage, status: fetchStatus, error: fetchError, refresh } = useFetch<MediaFilesPage>('/api/upload/files', {
  key: computed(() => `media-library-p${page.value}`),
  query: computed(() => ({ page: page.value, pageSize: MEDIA_PAGE_SIZE })),
  default: () => ({
    data: [],
    page: 1,
    pageSize: MEDIA_PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
  }),
});

const mediaFiles = computed(() => mediaPage.value?.data ?? []);
const hasNextPage = computed(() => mediaPage.value?.hasNextPage ?? false);
const hasPreviousPage = computed(() => mediaPage.value?.hasPreviousPage ?? false);

const loadingFiles = computed(() => fetchStatus.value === 'pending');
const loadError = computed(() => fetchError.value ? 'Failed to load media files.' : '');

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

      await $fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

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
    if (page.value !== 1) {
      page.value = 1;
    } else {
      await refresh();
    }
    setTimeout(() => clearStaged(), 1500);
  } else {
    errorMessage.value = `${failCount} ${failCount === 1 ? 'file' : 'files'} failed to upload. You can retry.`;
  }
}
</script>

<style scoped>
/* ---- Buttons ---- */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--button-padding-y) var(--button-padding-x);
  border: none;
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-button);
  min-height: var(--button-min-height);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.btn:disabled {
  opacity: var(--button-disabled-opacity);
  cursor: not-allowed;
}

.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  box-shadow: var(--button-shadow);
}

.btn--primary:hover:not(:disabled) {
  background: var(--button-primary-bg-hover);
  box-shadow: var(--button-shadow-hover);
}

.btn--outlined {
  background: var(--button-outlined-bg);
  color: var(--button-outlined-color);
  border: 1px solid var(--button-outlined-border);
}

.btn--outlined:hover {
  background: var(--button-outlined-hover-bg);
}

.btn__icon {
  width: 16px;
  height: 16px;
}

.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ---- Dropzone ---- */

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

/* ---- Staged Files ---- */

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

/* ---- Upload overlay ---- */

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

/* ---- File meta ---- */

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

/* ---- Alerts ---- */

.upload-error,
.upload-success {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.upload-error {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.upload-success {
  background: var(--color-success-muted);
  color: #047a3a;
}

.upload-error__icon,
.upload-success__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.upload-error__close,
.upload-success__close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  flex-shrink: 0;
}

.upload-error__close:hover,
.upload-success__close:hover {
  opacity: 1;
}

/* ---- Media Library ---- */

.library {
  margin-top: 2.5rem;
}

.library__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}

.library__title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
}

.library__count {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.library__empty-page {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
}

.library__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.library__pager-info {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  min-width: 5rem;
  text-align: center;
}

.library__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-medium);
}

.library__spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

/* ---- Media Card ---- */

.media-card {
  border-radius: var(--card-radius);
  border: var(--card-border);
  background: var(--color-surface-card);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.media-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.media-card__preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-surface);
  overflow: hidden;
}

.media-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.media-card__icon {
  width: 36px;
  height: 36px;
  color: var(--color-text-muted-light);
}

.media-card__info {
  padding: 0.625rem 0.75rem;
}

.media-card__name {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-card__meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .staged__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .staged__grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .library__grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
