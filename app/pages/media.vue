<template>
  <div>
    <CmsPageHeader
      title="Media"
      description="Upload and manage images, 3D models, and other assets."
    >
      <template #actions>
        <button type="button" class="btn btn--primary" @click="fileUploadRef?.openFilePicker()">
          <Icon name="lucide:upload" class="btn__icon" />
          Upload Files
        </button>
      </template>
    </CmsPageHeader>

    <BaseFileUpload ref="fileUploadRef" @uploaded="onUploadComplete" />

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

const fileUploadRef = ref<{ openFilePicker: () => void } | null>(null);
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

async function onUploadComplete() {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    await refresh();
  }
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

/* ---- Library load error ---- */

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  background: var(--color-error-muted);
  color: var(--color-error);
}

.upload-error__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
  .library__grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
