<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="subcategory-modal-title" :title="editingRow ? 'Edit subcategory' : 'New subcategory'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="subcategory-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <div class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label">Belongs to (choose one)</span>
          <div class="subcat-mode" role="radiogroup" aria-label="Parent type">
            <label class="subcat-mode__opt">
              <input v-model="formParentMode" type="radio" value="category" class="subcat-mode__radio" :disabled="formSaving" />
              <span>Category</span>
            </label>
            <label class="subcat-mode__opt">
              <input v-model="formParentMode" type="radio" value="subcategory" class="subcat-mode__radio" :disabled="formSaving" />
              <span>Subcategory</span>
            </label>
          </div>
        </div>
        <div v-if="formParentMode === 'category'" class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label">Category</span>
          <select v-model="formCategoryIdRaw" class="front-modal__select" :disabled="formSaving || taxonomyLoading">
            <option value="">— Select —</option>
            <option v-for="c in categoryOptions" :key="c.documentId" :value="String(c.id)">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div v-else class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label">Parent subcategory</span>
          <select v-model="formParentSubcategoryIdRaw" class="front-modal__select" :disabled="formSaving || taxonomyLoading">
            <option value="">— Select —</option>
            <option v-for="s in parentSubcategoryOptions" :key="s.documentId" :value="String(s.id)">
              {{ s.name }}
            </option>
          </select>
        </div>
        <p v-if="taxonomyLoadError" class="base-modal__error">{{ taxonomyLoadError }}</p>
        <BaseInputField label="Image" spaced>
          <div class="subcat-image-row">
            <div class="subcat-image-preview">
              <img v-if="modalImagePreview" :src="modalImagePreview" alt="" class="subcat-image-preview__img" />
              <div v-else class="subcat-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="subcat-image-actions">
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
        <BaseButton type="submit" form="subcategory-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
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
  extractSubcategoryCategory,
  extractSubcategoryParentRef,
} from '../../utils/subcategoryParent';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import type { Category } from '../../models/category';
import {
  createSubcategory,
  getAllCategories,
  getAllSubcategories,
  parseUploadResponseId,
  updateSubcategory,
  uploadMedia,
  type Subcategory,
} from '../../services';

export type SubcategoryModalRow = Subcategory;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editingRow = ref<SubcategoryModalRow | null>(null);
const formName = ref('');
const formParentMode = ref<'category' | 'subcategory'>('category');
const formCategoryIdRaw = ref('');
const formParentSubcategoryIdRaw = ref('');
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

const categoryOptions = ref<Category[]>([]);
const subcategoryOptions = ref<Subcategory[]>([]);
const taxonomyLoading = ref(false);
const taxonomyLoadError = ref('');

const parentSubcategoryOptions = computed(() => {
  const all = subcategoryOptions.value;
  const row = editingRow.value;
  if (!row) return all;
  return all.filter((s) => s.id !== row.id);
});

const modalImagePreview = computed(() => {
  if (imagePreviewUrlOverride.value) {
    return imagePreviewUrlOverride.value;
  }
  if (formImageTouched.value && formImageId.value === null) {
    return null;
  }
  const row = editingRow.value;
  if (row && !formImageTouched.value) {
    return extractPlinthImage(row, strapiPublicUrl.value).src;
  }
  return null;
});

function rowImageId(row: SubcategoryModalRow): number | null {
  return extractPlinthImage(row, strapiPublicUrl.value).id;
}

const canRemoveImage = computed(() => {
  if (modalImagePreview.value) return true;
  const row = editingRow.value;
  if (row && !formImageTouched.value) {
    return rowImageId(row) != null;
  }
  return false;
});

async function loadTaxonomy() {
  if (taxonomyLoading.value) return;
  taxonomyLoadError.value = '';
  taxonomyLoading.value = true;
  try {
    const [cats, subs] = await Promise.all([
      getAllCategories(1, 200),
      getAllSubcategories(1, 500),
    ]);
    categoryOptions.value = cats.data;
    subcategoryOptions.value = subs.data;
  } catch {
    taxonomyLoadError.value = 'Could not load categories or subcategories.';
  } finally {
    taxonomyLoading.value = false;
  }
}

watch(formParentMode, (mode) => {
  if (mode === 'category') {
    formParentSubcategoryIdRaw.value = '';
  } else {
    formCategoryIdRaw.value = '';
  }
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
  editingRow.value = null;
  formName.value = '';
  formParentMode.value = 'category';
  formCategoryIdRaw.value = '';
  formParentSubcategoryIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadTaxonomy();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: SubcategoryModalRow) {
  editingRow.value = row;
  formName.value = row.name;
  const cat = extractSubcategoryCategory(row);
  const par = extractSubcategoryParentRef(row);
  if (cat.id != null) {
    formParentMode.value = 'category';
    formCategoryIdRaw.value = String(cat.id);
    formParentSubcategoryIdRaw.value = '';
  } else if (par.id != null) {
    formParentMode.value = 'subcategory';
    formParentSubcategoryIdRaw.value = String(par.id);
    formCategoryIdRaw.value = '';
  } else {
    formParentMode.value = 'category';
    formCategoryIdRaw.value = '';
    formParentSubcategoryIdRaw.value = '';
  }
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadTaxonomy();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  mediaPickerOpen.value = false;
  resetImageFormState();
  modalOpen.value = false;
  editingRow.value = null;
  formName.value = '';
  formParentMode.value = 'category';
  formCategoryIdRaw.value = '';
  formParentSubcategoryIdRaw.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }

  let categoryId: number | null = null;
  let parentSubcategoryId: number | null = null;

  if (formParentMode.value === 'category') {
    const raw = formCategoryIdRaw.value.trim();
    if (!raw) {
      formError.value = 'Select a category.';
      return null;
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      formError.value = 'Choose a valid category.';
      return null;
    }
    categoryId = n;
    parentSubcategoryId = null;
  } else {
    const raw = formParentSubcategoryIdRaw.value.trim();
    if (!raw) {
      formError.value = 'Select a parent subcategory.';
      return null;
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      formError.value = 'Choose a valid parent subcategory.';
      return null;
    }
    if (editingRow.value && n === editingRow.value.id) {
      formError.value = 'A subcategory cannot be its own parent.';
      return null;
    }
    parentSubcategoryId = n;
    categoryId = null;
  }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    categoryId,
    parentSubcategoryId,
  };

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingRow.value === null;
  formSaving.value = true;
  try {
    if (editingRow.value) {
      await updateSubcategory(editingRow.value.documentId, body);
    } else {
      await createSubcategory(body);
    }
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save subcategory.');
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

.subcat-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.subcat-mode__opt {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: var(--paragraph-size);
  color: var(--color-text);
}

.subcat-mode__radio {
  accent-color: var(--color-primary, #2563eb);
}

.subcat-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .subcat-image-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.subcat-image-preview {
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

.subcat-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.subcat-image-preview__placeholder {
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

.subcat-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.subcat-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
