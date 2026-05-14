<template>
  <BaseModal v-model="modalOpen" title-id="category-modal-title" :title="editingCategory ? 'Edit category' : 'New category'" size="narrow" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="category-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
      <BaseInputField v-model="formValue" label="Value" type="text" name="value" autocomplete="off" maxlength="128" placeholder="e.g. base, wall, tall" :disabled="formSaving" />
      <p class="base-modal__hint">Optional. Stable key for the configurator (max 128 characters).</p>
      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="category-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createCategory, updateCategory, type Category } from '../../services/categories';

export type CategoryModalRow = Category;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const toast = useToast();

const modalOpen = ref(false);
const editingCategory = ref<CategoryModalRow | null>(null);
const formName = ref('');
const formValue = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

function openCreate() {
  editingCategory.value = null;
  formName.value = '';
  formValue.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(cat: CategoryModalRow) {
  editingCategory.value = cat;
  formName.value = cat.name;
  formValue.value = cat.value?.trim() ?? '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editingCategory.value = null;
  formName.value = '';
  formValue.value = '';
  formError.value = '';
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  const valueTrimmed = formValue.value.trim();
  const payload = { name, value: valueTrimmed === '' ? null : valueTrimmed };
  formError.value = '';
  formSaving.value = true;
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.documentId, payload);
    } else {
      await createCategory(payload);
    }
    const resetPage = editingCategory.value === null;
    formSaving.value = false;
    toast.success(resetPage ? 'Category created.' : 'Category updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save category.');
    formError.value = msg;
    toast.danger(msg);
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
.base-modal__hint {
  margin: -0.25rem 0 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: 1.4;
}
</style>
