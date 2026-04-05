<template>
  <BaseModal
    v-model="open"
    title="Choose image"
    title-id="plinth-media-picker-title"
    size="wide"
    :overlay-z-index="210"
  >
    <div class="picker-body">
      <div v-if="mediaLoadPending" class="picker-loading">
        <span class="modal-media__spinner" />
        <span>Loading library&hellip;</span>
      </div>
      <p v-else-if="mediaLoadError" class="base-modal__error">{{ mediaLoadError }}</p>
      <template v-else>
        <p v-if="pickerImageFiles.length === 0" class="picker-empty">
          No images in the library yet. Upload files on the Media page.
        </p>
        <div v-else class="picker-grid">
          <button
            v-for="f in pickerImageFiles"
            :key="f.id"
            type="button"
            class="picker-tile"
            :title="f.name"
            @click="onSelect(f)"
          >
            <img
              :src="f.thumbnail || f.url"
              :alt="f.name"
              loading="lazy"
            />
          </button>
        </div>
        <div v-if="pickerHasNextPage" class="picker-footer">
          <BaseButton
            type="button"
            variant="outlined"
            size="sm"
            :disabled="mediaLoadPending"
            @click="loadMore"
          >
            Load more
          </BaseButton>
        </div>
      </template>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import {
  fetchMediaFilesPage,
  type MediaPickerFile,
} from '../../utils/service/upload';

export type { MediaPickerFile };

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  select: [file: MediaPickerFile];
}>();

const mediaLoadPending = ref(false);
const mediaLoadError = ref('');
const mediaPickerFiles = ref<MediaPickerFile[]>([]);
const pickerHasNextPage = ref(false);
const pickerPage = ref(1);

const pickerImageFiles = computed(() =>
  mediaPickerFiles.value.filter((f) => f.mime.startsWith('image/')),
);

async function fetchPickerPage(nextPage: number, replace: boolean) {
  mediaLoadPending.value = true;
  mediaLoadError.value = '';
  try {
    const res = await fetchMediaFilesPage({
      page: nextPage,
      pageSize: 24,
    });
    if (replace) {
      mediaPickerFiles.value = res.data;
    } else {
      mediaPickerFiles.value = [...mediaPickerFiles.value, ...res.data];
    }
    pickerHasNextPage.value = res.hasNextPage;
    pickerPage.value = nextPage;
  } catch {
    mediaLoadError.value = 'Could not load media library.';
  } finally {
    mediaLoadPending.value = false;
  }
}

async function loadMore() {
  if (!pickerHasNextPage.value || mediaLoadPending.value) return;
  await fetchPickerPage(pickerPage.value + 1, false);
}

function onSelect(f: MediaPickerFile) {
  if (!f.mime.startsWith('image/')) return;
  emit('select', f);
  open.value = false;
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    mediaLoadError.value = '';
    return;
  }
  pickerPage.value = 1;
  await fetchPickerPage(1, true);
});
</script>

<style scoped>
.picker-body {
  max-height: min(60vh, 420px);
  overflow: auto;
}

.picker-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-small);
}

.modal-media__spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.picker-empty {
  margin: 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.5rem;
}

.picker-tile {
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--button-radius);
  overflow: hidden;
  cursor: pointer;
  background: var(--color-surface);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.picker-tile:hover {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.picker-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picker-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
