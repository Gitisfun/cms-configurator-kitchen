<template>
  <div>
    <CmsPageHeader
      title="Plinths"
      description="Manage plinth types, pricing, and colors for kitchen configurations."
    >
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add plinth
        </BaseButton>
      </template>
    </CmsPageHeader>

    <section class="panel">
      <div v-if="!pending && !error && pagination" class="panel__toolbar">
        <span class="panel__summary">
          {{ pagination.total }}
          {{ pagination.total === 1 ? 'plinth' : 'plinths' }}
        </span>
      </div>

      <div v-if="pending" class="panel__loading">
        <span class="panel__spinner" />
        <span>Loading plinths&hellip;</span>
      </div>

      <div v-else-if="error" class="alert alert--error">
        <Icon name="lucide:alert-triangle" class="alert__icon" />
        <span>Failed to load plinths.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()">
          Retry
        </BaseButton>
      </div>

      <div
        v-else-if="plinths.length === 0 && page === 1"
        class="panel__empty"
      >
        <div class="panel__empty-icon">
          <Icon name="lucide:stretch-horizontal" />
        </div>
        <h3 class="panel__empty-title">No plinths yet</h3>
        <p class="panel__empty-desc">
          Add your first plinth with a name. Price and color are optional.
        </p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create plinth
        </BaseButton>
      </div>

      <div
        v-else-if="plinths.length === 0 && page > 1"
        class="panel__empty-offpage"
      >
        <p class="panel__empty-page">No plinths on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1">
          Back to first page
        </BaseButton>
      </div>

      <BaseTable v-else>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Price</th>
            <th scope="col">Color</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="p in plinths" :key="p.documentId">
          <td class="base-table__image-cell">
            <div v-if="plinthImageSrc(p)" class="base-table__thumb-wrap">
              <img
                :src="plinthImageSrc(p)!"
                alt=""
                class="base-table__thumb"
                loading="lazy"
              />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:stretch-horizontal" />
              </span>
              <span class="base-table__name-text">{{ p.name }}</span>
            </div>
          </td>
          <td>{{ formatPrice(p.price) }}</td>
          <td>{{ p.color || '—' }}</td>
          <td>{{ formatDate(p.publishedAt) }}</td>
          <td>{{ formatDate(p.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton
                type="button"
                variant="text"
                :disabled="deletingDocumentId === p.documentId"
                @click="openEditModal(p)"
              >
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton
                type="button"
                variant="text"
                danger
                :disabled="deletingDocumentId === p.documentId"
                @click="confirmDelete(p)"
              >
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <nav
        v-if="!error && !pending && pagination && (plinths.length > 0 || page > 1)"
        class="pager"
        aria-label="Plinth pages"
      >
        <BaseButton
          type="button"
          variant="outlined"
          :disabled="page <= 1 || pending"
          @click="page--"
        >
          <Icon name="lucide:chevron-left" class="base-btn__icon" />
          Previous
        </BaseButton>
        <span class="pager__info">
          Page {{ pagination.page }} of {{ pagination.pageCount }}
        </span>
        <BaseButton
          type="button"
          variant="outlined"
          :disabled="page >= pagination.pageCount || pending"
          @click="page++"
        >
          Next
          <Icon name="lucide:chevron-right" class="base-btn__icon" />
        </BaseButton>
      </nav>
    </section>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="modal-backdrop"
        role="presentation"
        @click.self="!formSaving && closeModal()"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="modalTitleId"
        >
          <div class="modal__header">
            <h2 :id="modalTitleId" class="modal__title">
              {{ editingPlinth ? 'Edit plinth' : 'New plinth' }}
            </h2>
            <button
              type="button"
              class="modal__close"
              aria-label="Close"
              :disabled="formSaving"
              @click="closeModal"
            >
              <Icon name="lucide:x" />
            </button>
          </div>
          <form class="modal__body" @submit.prevent="submitModal">
            <label class="field">
              <span class="field__label">Name <span class="field__req">*</span></span>
              <input
                ref="nameInputRef"
                v-model="formName"
                type="text"
                class="field__input"
                name="name"
                autocomplete="off"
                maxlength="255"
                required
                :disabled="formSaving"
              />
            </label>
            <label class="field field--spaced">
              <span class="field__label">Price</span>
              <input
                v-model="formPrice"
                type="text"
                class="field__input"
                name="price"
                inputmode="decimal"
                placeholder="Optional"
                :disabled="formSaving"
              />
            </label>
            <label class="field field--spaced">
              <span class="field__label">Color</span>
              <input
                v-model="formColor"
                type="text"
                class="field__input"
                name="color"
                maxlength="255"
                placeholder="Optional"
                :disabled="formSaving"
              />
            </label>
            <div class="field field--spaced">
              <span class="field__label">Image</span>
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
            </div>
            <p v-if="formError" class="modal__error">{{ formError }}</p>
            <div class="modal__footer">
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
                variant="primary"
                :disabled="formSaving"
                :loading="formSaving"
              >
                {{ formSaving ? 'Saving…' : 'Save' }}
              </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="mediaPickerOpen"
        class="modal-backdrop modal-backdrop--nested"
        role="presentation"
        @click.self="closeMediaPicker"
      >
        <div
          class="modal modal--wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plinth-media-picker-title"
        >
          <div class="modal__header">
            <h2 id="plinth-media-picker-title" class="modal__title">
              Choose image
            </h2>
            <button
              type="button"
              class="modal__close"
              aria-label="Close"
              @click="closeMediaPicker"
            >
              <Icon name="lucide:x" />
            </button>
          </div>
          <div class="modal__body picker-body">
            <div v-if="mediaLoadPending" class="picker-loading">
              <span class="panel__spinner" />
              <span>Loading library&hellip;</span>
            </div>
            <p v-else-if="mediaLoadError" class="modal__error">{{ mediaLoadError }}</p>
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
                  @click="selectMediaFile(f)"
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
                  @click="loadMorePickerMedia"
                >
                  Load more
                </BaseButton>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Plinth {
  id: number;
  documentId: string;
  name: string;
  /** Strapi decimals often arrive as strings over JSON */
  price: number | string | null;
  color: string | null;
  /** Populated media (Strapi 4 `data` or Strapi 5 flat). */
  image?: unknown;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface MediaFileRow {
  id: number;
  name: string;
  mime: string;
  url: string;
  thumbnail: string | null;
}

interface MediaFilesPage {
  data: MediaFileRow[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PlinthsResponse {
  data: Plinth[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

const PAGE_SIZE = 25;
const page = ref(1);

const { public: publicConfig } = useRuntimeConfig();
const strapiPublicUrl = computed(() =>
  String(publicConfig.strapiUrl || 'http://localhost:1337').replace(/\/$/, ''),
);

function extractPlinthImage(
  plinth: Plinth,
  strapiBase: string,
): { id: number | null; src: string | null } {
  const raw = plinth.image;
  if (raw == null) return { id: null, src: null };

  const base = strapiBase.replace(/\/$/, '');

  function toSrc(path: string | undefined | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  if (
    typeof raw === 'object'
    && raw !== null
    && !Array.isArray(raw)
    && 'url' in raw
  ) {
    const o = raw as {
      id?: number;
      url?: string;
      formats?: { thumbnail?: { url?: string } } | null;
    };
    const thumb = o.formats?.thumbnail?.url;
    const src = toSrc(thumb || o.url);
    const id =
      typeof o.id === 'number' && Number.isFinite(o.id) ? o.id : null;
    return { id, src };
  }

  const wrapped = raw as {
    data?: {
      id?: number;
      attributes?: {
        url?: string;
        formats?: { thumbnail?: { url?: string } };
      };
    } | null;
  };
  const d = wrapped.data;
  if (!d || typeof d !== 'object') return { id: null, src: null };
  const id = typeof d.id === 'number' && Number.isFinite(d.id) ? d.id : null;
  const attrs = d.attributes ?? (d as unknown as { url?: string; formats?: { thumbnail?: { url?: string } } });
  const thumb = attrs.formats?.thumbnail?.url;
  const src = toSrc(thumb || attrs.url);
  return { id, src };
}

function plinthImageSrc(p: Plinth): string | null {
  return extractPlinthImage(p, strapiPublicUrl.value).src;
}

function plinthImageId(p: Plinth): number | null {
  return extractPlinthImage(p, strapiPublicUrl.value).id;
}

function normalizeUploadResponse(raw: unknown): { id: number } | null {
  if (
    Array.isArray(raw)
    && raw[0]
    && typeof raw[0] === 'object'
    && typeof (raw[0] as { id?: unknown }).id === 'number'
  ) {
    return { id: (raw[0] as { id: number }).id };
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (
      Array.isArray(r.data)
      && r.data[0]
      && typeof r.data[0] === 'object'
      && typeof (r.data[0] as { id?: unknown }).id === 'number'
    ) {
      return { id: (r.data[0] as { id: number }).id };
    }
    if (
      r.data
      && typeof r.data === 'object'
      && !Array.isArray(r.data)
      && typeof (r.data as { id?: unknown }).id === 'number'
    ) {
      return { id: (r.data as { id: number }).id };
    }
  }
  return null;
}

const { data, pending, error, refresh } = useFetch<PlinthsResponse>('/api/plinths', {
  key: computed(() => `plinths-p${page.value}`),
  query: computed(() => ({
    'pagination[page]': page.value,
    'pagination[pageSize]': PAGE_SIZE,
  })),
  default: () => ({
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize: PAGE_SIZE,
        pageCount: 1,
        total: 0,
      },
    },
  }),
});

const plinths = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const modalOpen = ref(false);
const editingPlinth = ref<Plinth | null>(null);
const formName = ref('');
const formPrice = ref('');
const formColor = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);
const imageFileInputRef = ref<HTMLInputElement | null>(null);
const modalTitleId = 'plinth-modal-title';
const deletingDocumentId = ref<string | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);
const imagePreviewUrlOverride = ref<string | null>(null);
let blobPreviewUrl: string | null = null;

const uploadingImage = ref(false);

const mediaPickerOpen = ref(false);
const mediaLoadPending = ref(false);
const mediaLoadError = ref('');
const mediaPickerFiles = ref<MediaFileRow[]>([]);
const pickerHasNextPage = ref(false);
const pickerPage = ref(1);

const pickerImageFiles = computed(() =>
  mediaPickerFiles.value.filter((f) => f.mime.startsWith('image/')),
);

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
    const raw = await $fetch<unknown>('/api/upload', { method: 'POST', body: fd });
    const first = normalizeUploadResponse(raw);
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

function closeMediaPicker() {
  mediaPickerOpen.value = false;
  mediaLoadError.value = '';
}

async function fetchPickerPage(nextPage: number, replace: boolean) {
  mediaLoadPending.value = true;
  mediaLoadError.value = '';
  try {
    const res = await $fetch<MediaFilesPage>('/api/upload/files', {
      query: { page: nextPage, pageSize: 24 },
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

async function openMediaPicker() {
  if (formSaving.value) return;
  mediaPickerOpen.value = true;
  pickerPage.value = 1;
  await fetchPickerPage(1, true);
}

async function loadMorePickerMedia() {
  if (!pickerHasNextPage.value || mediaLoadPending.value) return;
  await fetchPickerPage(pickerPage.value + 1, false);
}

function selectMediaFile(f: MediaFileRow) {
  if (!f.mime.startsWith('image/')) return;
  revokeBlobPreview();
  imagePreviewUrlOverride.value = f.thumbnail || f.url;
  formImageId.value = f.id;
  formImageTouched.value = true;
  closeMediaPicker();
}

function openCreateModal() {
  editingPlinth.value = null;
  formName.value = '';
  formPrice.value = '';
  formColor.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function priceToFormString(price: Plinth['price']): string {
  if (price == null) return '';
  if (typeof price === 'number' && Number.isFinite(price)) return String(price);
  if (typeof price === 'string') {
    const t = price.trim();
    return t === '' ? '' : t;
  }
  return '';
}

function openEditModal(p: Plinth) {
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
  closeMediaPicker();
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

async function confirmDelete(p: Plinth) {
  if (!window.confirm(`Delete plinth "${p.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = p.documentId;
  try {
    await $fetch(`/api/plinths/${encodeURIComponent(p.documentId)}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (e: unknown) {
    const err = e as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    const msg =
      err.data?.statusMessage
      || err.data?.message
      || err.statusMessage
      || err.message
      || 'Failed to delete plinth.';
    window.alert(msg);
  } finally {
    deletingDocumentId.value = null;
  }
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  formSaving.value = true;
  try {
    if (editingPlinth.value) {
      await $fetch(`/api/plinths/${encodeURIComponent(editingPlinth.value.documentId)}`, {
        method: 'PUT',
        body,
      });
    } else {
      await $fetch('/api/plinths', {
        method: 'POST',
        body,
      });
      page.value = 1;
    }
    formSaving.value = false;
    closeModal();
    await refresh();
  } catch (e: unknown) {
    const err = e as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    formError.value =
      err.data?.statusMessage
      || err.data?.message
      || err.statusMessage
      || err.message
      || 'Could not save plinth.';
  } finally {
    formSaving.value = false;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPrice(value: Plinth['price']): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
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
        closeMediaPicker();
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
</script>

<style scoped>
.panel {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.panel__summary {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.panel__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-medium);
}

.panel__spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.panel__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-info-muted);
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.panel__empty-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.panel__empty-title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.375rem;
}

.panel__empty-desc {
  margin: 0;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: var(--line-height-body);
}

.panel__empty :deep(.base-btn) {
  margin-top: 1.25rem;
}

.panel__empty-offpage {
  padding: 1.5rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.panel__empty-page {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 1rem 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.alert--error {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.alert__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(27, 58, 92, 0.45);
  backdrop-filter: blur(2px);
}

.modal-backdrop--nested {
  z-index: 210;
}

.modal {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface-card);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow-hover);
  border: var(--card-border);
  outline: none;
}

.modal--wide {
  max-width: min(720px, 100vw - 2rem);
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.modal__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--header-size-medium);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-heading);
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: -0.25rem -0.25rem 0 0;
  border: none;
  border-radius: var(--button-radius);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.modal__close:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.modal__close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal__close :deep(svg) {
  width: 20px;
  height: 20px;
}

.modal__body {
  padding: 1rem 1.25rem 1.25rem;
}

.modal__error {
  margin: 0.75rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field--spaced {
  margin-top: 1rem;
}

.field__label {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
}

.field__req {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field__input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.field__input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.field__input::placeholder {
  color: var(--color-text-muted-light);
}

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

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.25rem 1.25rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.pager__info {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  min-width: 8rem;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
