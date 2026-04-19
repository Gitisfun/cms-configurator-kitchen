<template>
  <BaseModal v-model="modalOpen" title-id="cabinet-series-modal-title" :title="editing ? 'Edit cabinet series' : 'New cabinet series'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="cabinet-series-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formCode" label="Code" required-mark type="text" name="code" autocomplete="off" maxlength="255" required :disabled="formSaving" spaced />
      <BaseInputField v-model="formCarcaseHeight" label="Carcase height (mm)" type="number" name="carcaseHeight" min="1" step="1" :disabled="formSaving" spaced />
      <BaseInputField v-model="formDefaultCarcaseDepth" label="Default carcase depth (mm)" type="number" name="defaultCarcaseDepth" min="1" step="1" :disabled="formSaving" spaced />

      <div class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Product line</span>
        <select v-model="formProductLine" class="cs-modal__select" :disabled="formSaving">
          <option value="">— None —</option>
          <option value="standard">Standard</option>
          <option value="cLine">C-Line</option>
          <option value="xLine">X-Line</option>
        </select>
      </div>

      <div class="cs-modal__field cs-modal__field--spaced">
        <span class="cs-modal__label">Subcategory</span>
        <select v-model="formSubcategoryIdRaw" class="cs-modal__select" :disabled="formSaving || subcategoriesLoading">
          <option value="">— None —</option>
          <option v-for="sc in subcategoryOptions" :key="sc.documentId" :value="String(sc.id)">
            {{ sc.name }}
          </option>
        </select>
        <p v-if="subcategoryLoadError" class="base-modal__error">{{ subcategoryLoadError }}</p>
      </div>

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
const formSubcategoryIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

const subcategoryOptions = ref<Subcategory[]>([]);
const subcategoriesLoading = ref(false);
const subcategoryLoadError = ref('');

async function loadSubcategoriesIfNeeded() {
  if (subcategoryOptions.value.length > 0 || subcategoriesLoading.value) return;
  subcategoryLoadError.value = '';
  subcategoriesLoading.value = true;
  try {
    const res = await getAllSubcategories(1, 200);
    subcategoryOptions.value = res.data;
  } catch {
    subcategoryLoadError.value = 'Could not load subcategories.';
  } finally {
    subcategoriesLoading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formCode.value = '';
  formCarcaseHeight.value = '';
  formDefaultCarcaseDepth.value = '';
  formProductLine.value = '';
  formSubcategoryIdRaw.value = '';
  formError.value = '';
  modalOpen.value = true;
  void loadSubcategoriesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetSeriesModalRow) {
  editing.value = row;
  formName.value = row.name;
  formCode.value = row.code;
  formCarcaseHeight.value = row.carcaseHeight != null ? String(row.carcaseHeight) : '';
  formDefaultCarcaseDepth.value = row.defaultCarcaseDepth != null ? String(row.defaultCarcaseDepth) : '';
  formProductLine.value = row.productLine ?? '';
  const scId = extractRelationNumericId(row.subcategory);
  formSubcategoryIdRaw.value = scId != null ? String(scId) : '';
  formError.value = '';
  modalOpen.value = true;
  void loadSubcategoriesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) { formError.value = 'Please enter a name.'; return; }
  const code = formCode.value.trim();
  if (!code) { formError.value = 'Please enter a code.'; return; }
  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    code,
  };

  const chRaw = formCarcaseHeight.value.trim();
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

  const depth = formDefaultCarcaseDepth.value.trim();
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

  const rawSc = formSubcategoryIdRaw.value.trim();
  body.subcategoryId = rawSc ? Number(rawSc) : null;

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
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
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
</style>
