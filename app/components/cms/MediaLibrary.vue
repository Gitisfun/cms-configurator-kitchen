<template>
  <section class="library">
    <div class="library__header">
      <h3 class="library__title">Media Library</h3>
      <span v-if="mediaFiles.length || page > 1" class="library__count">
        {{ mediaFiles.length }} on this page
      </span>
    </div>

    <div v-if="mediaFiles.length > 0 && !loadError && !loadingFiles" class="library__toolbar">
      <label class="library__select-all">
        <input
          ref="selectAllInputRef"
          type="checkbox"
          class="library__checkbox"
          @change="onSelectAllChange"
        />
        <span>Select all on this page</span>
      </label>
      <span v-if="selectedCount > 0" class="library__selected-count">{{ selectedCount }} selected</span>
      <BaseButton
        type="button"
        variant="text"
        danger
        :disabled="selectedCount === 0 || deleting"
        :loading="deleting"
        aria-label="Delete selected files"
        @click="deleteSelected"
      >
        <Icon name="lucide:trash-2" class="base-btn__icon" />
        Delete selected
      </BaseButton>
    </div>

    <p v-if="deleteError" class="library__delete-error" role="alert">
      <Icon name="lucide:alert-circle" class="library__delete-error-icon" />
      {{ deleteError }}
    </p>

    <div v-if="loadingFiles" class="library__loading">
      <span class="library__spinner" />
      <span>Loading files&hellip;</span>
    </div>

    <div v-else-if="loadError" class="library__error">
      <Icon name="lucide:alert-triangle" class="library__error-icon" />
      <span>{{ loadError }}</span>
      <BaseButton type="button" variant="outlined" size="sm" @click="refresh()">
        Retry
      </BaseButton>
    </div>

    <CmsEmptyState
      v-else-if="mediaFiles.length === 0 && page === 1"
      title="No files yet"
      description="Upload your first files using the dropzone above."
      icon="lucide:image"
    />

    <template v-else-if="mediaFiles.length === 0 && page > 1">
      <p class="library__empty-page">No files on this page.</p>
      <BaseButton type="button" variant="outlined" @click="page = 1">
        Back to first page
      </BaseButton>
    </template>

    <div v-else class="library__grid">
      <div
        v-for="file in mediaFiles"
        :key="file.id"
        class="media-card"
        :class="{ 'media-card--selected': isSelected(file.id) }"
      >
        <div class="media-card__preview">
          <label class="media-card__checkbox-wrap" @click.stop>
            <input
              type="checkbox"
              class="media-card__checkbox"
              :checked="isSelected(file.id)"
              :aria-label="`Select ${file.name}`"
              @change="toggleFile(file.id)"
            />
          </label>
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

    <BasePagination
      v-if="!loadError && !loadingFiles && (mediaFiles.length > 0 || hasPreviousPage || hasNextPage)"
      v-model:page="page"
      :has-previous-page="hasPreviousPage"
      :has-next-page="hasNextPage"
      :disabled="loadingFiles"
      aria-label="Media library pages"
      variant="section"
    />
  </section>
</template>

<script setup lang="ts">
import type { MediaFilesPage } from '../../models/media';
import { deleteMediaFile } from '../../services/upload';

const props = withDefaults(
  defineProps<{
    pageSize?: number;
  }>(),
  {
    pageSize: 24,
  },
);

const page = ref(1);
const selectedIds = ref<number[]>([]);
const deleting = ref(false);
const deleteError = ref('');
const selectAllInputRef = ref<HTMLInputElement | null>(null);
const { requestConfirm } = useConfirmDialog();
const toast = useToast();

const { data: mediaPage, status: fetchStatus, error: fetchError, refresh } = useFetch<MediaFilesPage>('/api/upload/files', {
  key: computed(() => `media-library-p${page.value}`),
  query: computed(() => ({ page: page.value, pageSize: props.pageSize })),
  default: () => ({
    data: [],
    page: 1,
    pageSize: props.pageSize,
    hasNextPage: false,
    hasPreviousPage: false,
  }),
});

const mediaFiles = computed(() => mediaPage.value?.data ?? []);
const hasNextPage = computed(() => mediaPage.value?.hasNextPage ?? false);
const hasPreviousPage = computed(() => mediaPage.value?.hasPreviousPage ?? false);

const selectedCount = computed(() => selectedIds.value.length);

const loadingFiles = computed(() => fetchStatus.value === 'pending');
const loadError = computed(() => fetchError.value ? 'Failed to load media files.' : '');

function isSelected(id: number) {
  return selectedIds.value.includes(id);
}

function toggleFile(id: number) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = [...next];
}

function onSelectAllChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    selectedIds.value = mediaFiles.value.map((f) => f.id);
  } else {
    selectedIds.value = [];
  }
}

watch(
  [selectedIds, mediaFiles],
  () => {
    const el = selectAllInputRef.value;
    if (!el || mediaFiles.value.length === 0) return;
    const n = selectedIds.value.length;
    const t = mediaFiles.value.length;
    el.indeterminate = n > 0 && n < t;
    el.checked = t > 0 && n === t;
  },
  { flush: 'post' },
);

watch(page, () => {
  selectedIds.value = [];
  deleteError.value = '';
});

watch(mediaFiles, (files) => {
  const allowed = new Set(files.map((f) => f.id));
  selectedIds.value = selectedIds.value.filter((id) => allowed.has(id));
});

async function deleteSelected() {
  const ids = [...selectedIds.value];
  if (ids.length === 0) return;
  const n = ids.length;
  const ok = await requestConfirm({
    title: n === 1 ? 'Delete file?' : 'Delete files?',
    message: `Delete ${n} file${n === 1 ? '' : 's'}? This cannot be undone.`,
  });
  if (!ok) return;

  deleting.value = true;
  deleteError.value = '';

  const results = await Promise.allSettled(ids.map((id) => deleteMediaFile(id)));
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    deleteError.value =
      failed === n
        ? 'Could not delete the selected files.'
        : `${failed} of ${n} file(s) could not be deleted.`;
    toast.danger(deleteError.value);
  } else {
    toast.success(n === 1 ? 'File deleted.' : `${n} files deleted.`);
  }

  selectedIds.value = [];
  await refresh();
  deleting.value = false;
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

async function afterUpload() {
  if (page.value !== 1) {
    page.value = 1;
  } else {
    await refresh();
  }
}

defineExpose({
  afterUpload,
  refresh,
});
</script>

<style scoped>
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

.library__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.library__select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

.library__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-brand);
}

.library__selected-count {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.library__delete-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  background: var(--color-error-muted);
  color: var(--color-error);
}

.library__delete-error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.library__empty-page {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
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
  animation: library-spin 0.6s linear infinite;
}

.library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.library__error {
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

.library__error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.media-card {
  border-radius: var(--card-radius);
  border: var(--card-border);
  background: var(--color-surface-card);
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    outline 0.15s ease;
}

.media-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.media-card--selected {
  outline: 2px solid var(--color-brand);
  outline-offset: -1px;
}

.media-card__preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-surface);
  overflow: hidden;
}

.media-card__checkbox-wrap {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  cursor: pointer;
}

.media-card__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-brand);
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

@keyframes library-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .library__grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
