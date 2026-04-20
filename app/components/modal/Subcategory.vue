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
          <select v-model="formCategoryIdRaw" class="front-modal__select cms-native-select" :disabled="formSaving || taxonomyLoading">
            <option value="">— Select —</option>
            <option v-for="c in categoryOptions" :key="c.documentId" :value="String(c.id)">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div v-else class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label">Parent subcategory</span>
          <select v-model="formParentSubcategoryIdRaw" class="front-modal__select cms-native-select" :disabled="formSaving || taxonomyLoading">
            <option value="">— Select —</option>
            <option v-for="s in parentSubcategoryOptions" :key="s.documentId" :value="String(s.id)">
              {{ s.name }}
            </option>
          </select>
        </div>
        <p v-if="taxonomyLoadError" class="base-modal__error">{{ taxonomyLoadError }}</p>
        <BaseImageUpload
          ref="imageFieldRef"
          v-model:image-id="formImageId"
          v-model:image-touched="formImageTouched"
          :row-preview-url="rowImage.src"
          :row-image-id="rowImage.id"
          :disabled="formSaving"
          @error="onImageFieldError"
        />
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="subcategory-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
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
  updateSubcategory,
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
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

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

const rowImage = computed(() => {
  const row = editingRow.value;
  if (!row) return { src: null as string | null, id: null as number | null };
  const ex = extractPlinthImage(row, strapiPublicUrl.value);
  return { src: ex.src, id: ex.id };
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

function resetImageFormState() {
  imageFieldRef.value?.reset();
}

function onImageFieldError(message: string) {
  formError.value = message;
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
      if (imageFieldRef.value?.attemptCloseMediaPicker()) {
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
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  padding-left: 0.75rem;
  padding-right: var(--cms-select-padding-end);
  padding-inline-end: var(--cms-select-padding-end);
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-surface-card);
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
</style>
