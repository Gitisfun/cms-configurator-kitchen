<template>
  <BaseModal v-model="modalOpen" title-id="cabinet-series-modal-title" :title="editing ? 'Edit cabinet series' : 'New cabinet series'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="cabinet-series-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formCode" label="Code" required-mark type="text" name="code" autocomplete="off" maxlength="255" required :disabled="formSaving" spaced />
      <BaseInputField v-model="formCarcaseHeight" label="Carcase height (mm)" type="number" name="carcaseHeight" min="1" step="1" :disabled="formSaving" spaced />
      <BaseInputField v-model="formDefaultCarcaseDepth" label="Default carcase depth (mm)" type="number" name="defaultCarcaseDepth" min="1" step="1" :disabled="formSaving" spaced />

      <div class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Product line</span>
        <select v-model="formProductLine" class="cs-modal__select cms-native-select" :disabled="formSaving">
          <option value="">— None —</option>
          <option value="standard">Standard</option>
          <option value="cLine">C-Line</option>
          <option value="xLine">X-Line</option>
        </select>
      </div>

      <div class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Belongs to (choose one)</span>
        <div class="subcat-mode" role="radiogroup" aria-label="Link series to category or subcategory">
          <label class="subcat-mode__opt">
            <input v-model="formTaxonomyMode" type="radio" value="category" class="subcat-mode__radio" :disabled="formSaving" />
            <span>Category</span>
          </label>
          <label class="subcat-mode__opt">
            <input v-model="formTaxonomyMode" type="radio" value="subcategory" class="subcat-mode__radio" :disabled="formSaving" />
            <span>Subcategory</span>
          </label>
        </div>
      </div>

      <div v-if="formTaxonomyMode === 'category'" class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Category</span>
        <select v-model="formCategoryIdRaw" class="cs-modal__select cms-native-select" :disabled="formSaving || taxonomyLoading">
          <option value="">— Select —</option>
          <option v-for="c in categoryOptions" :key="c.documentId" :value="String(c.id)">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div v-else class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Subcategory</span>
        <select v-model="formSubcategoryIdRaw" class="cs-modal__select cms-native-select" :disabled="formSaving || taxonomyLoading">
          <option value="">— Select —</option>
          <option v-for="sc in subcategoryOptions" :key="sc.documentId" :value="String(sc.id)">
            {{ sc.name }}
          </option>
        </select>
      </div>

      <p v-if="taxonomyLoadError" class="base-modal__error">{{ taxonomyLoadError }}</p>

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="cabinet-series-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import { createCabinetSeries, updateCabinetSeries, type CabinetSeries } from '../../services/cabinet-series';
import { getAllCategories, type Category } from '../../services/categories';
import { getAllSubcategories, type Subcategory } from '../../services/subcategories';

export type CabinetSeriesModalRow = CabinetSeries;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editing = ref<CabinetSeriesModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formCarcaseHeight = ref('');
const formDefaultCarcaseDepth = ref('');
const formProductLine = ref('');
const formTaxonomyMode = ref<'category' | 'subcategory'>('category');
const formCategoryIdRaw = ref('');
const formSubcategoryIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

const categoryOptions = ref<Category[]>([]);
const subcategoryOptions = ref<Subcategory[]>([]);
const taxonomyLoading = ref(false);
const taxonomyLoadError = ref('');

async function loadTaxonomy() {
  if (taxonomyLoading.value) return;
  taxonomyLoadError.value = '';
  taxonomyLoading.value = true;
  try {
    const [cats, subs] = await Promise.all([getAllCategories(1, 200), getAllSubcategories(1, 500)]);
    categoryOptions.value = cats.data;
    subcategoryOptions.value = subs.data;
  } catch {
    taxonomyLoadError.value = 'Could not load categories or subcategories.';
  } finally {
    taxonomyLoading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formCode.value = '';
  formCarcaseHeight.value = '';
  formDefaultCarcaseDepth.value = '';
  formProductLine.value = '';
  formTaxonomyMode.value = 'category';
  formCategoryIdRaw.value = '';
  formSubcategoryIdRaw.value = '';
  formError.value = '';
  modalOpen.value = true;
  void loadTaxonomy();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetSeriesModalRow) {
  editing.value = row;
  formName.value = row.name;
  formCode.value = row.code;
  formCarcaseHeight.value = row.carcaseHeight != null ? String(row.carcaseHeight) : '';
  formDefaultCarcaseDepth.value = row.defaultCarcaseDepth != null ? String(row.defaultCarcaseDepth) : '';
  formProductLine.value = row.productLine ?? '';
  const catId = extractRelationNumericId(row.category);
  const scId = extractRelationNumericId(row.subcategory);
  if (catId != null) {
    formTaxonomyMode.value = 'category';
    formCategoryIdRaw.value = String(catId);
    formSubcategoryIdRaw.value = '';
  } else if (scId != null) {
    formTaxonomyMode.value = 'subcategory';
    formSubcategoryIdRaw.value = String(scId);
    formCategoryIdRaw.value = '';
  } else {
    formTaxonomyMode.value = 'category';
    formCategoryIdRaw.value = '';
    formSubcategoryIdRaw.value = '';
  }
  formError.value = '';
  modalOpen.value = true;
  void loadTaxonomy();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  const code = formCode.value.trim();
  if (!code) {
    formError.value = 'Please enter a code.';
    return;
  }
  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    code,
  };

  const chRaw = String(formCarcaseHeight.value ?? '').trim();
  if (chRaw !== '') {
    const carcaseHeight = Number(chRaw);
    if (!Number.isFinite(carcaseHeight) || carcaseHeight < 1) {
      formError.value = 'Please enter a valid carcase height or leave it empty.';
      return;
    }
    body.carcaseHeight = carcaseHeight;
  } else {
    body.carcaseHeight = null;
  }

  const depth = String(formDefaultCarcaseDepth.value ?? '').trim();
  if (depth !== '') {
    const n = Number(depth);
    if (!Number.isFinite(n) || n < 1) {
      formError.value = 'Please enter a valid default depth or leave it empty.';
      return;
    }
    body.defaultCarcaseDepth = n;
  } else {
    body.defaultCarcaseDepth = null;
  }

  body.productLine = formProductLine.value || null;

  if (formTaxonomyMode.value === 'category') {
    const rawCat = formCategoryIdRaw.value.trim();
    body.categoryId = rawCat ? Number(rawCat) : null;
    body.subcategoryId = null;
  } else {
    const rawSc = formSubcategoryIdRaw.value.trim();
    body.categoryId = null;
    body.subcategoryId = rawSc ? Number(rawSc) : null;
  }

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetSeries(editing.value.documentId, body);
    } else {
      await createCabinetSeries(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save cabinet series.');
  } finally {
    formSaving.value = false;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(formTaxonomyMode, (mode) => {
  if (mode === 'category') {
    formSubcategoryIdRaw.value = '';
  } else {
    formCategoryIdRaw.value = '';
  }
});

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
    escKeyHandler = null;
  }
  if (open) {
    escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formSaving.value) closeModal();
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
.cs-modal__field--spaced {
  margin-top: 1rem;
}

.cs-modal__label {
  display: block;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin-bottom: 0.375rem;
}

.cs-modal__select {
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

.cs-modal__select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.cs-modal__select:disabled {
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
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-primary);
}

.subcat-mode__radio {
  accent-color: var(--color-primary, #2563eb);
}
</style>
