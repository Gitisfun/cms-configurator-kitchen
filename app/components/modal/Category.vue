<template>
  <BaseModal v-model="modalOpen" title-id="category-modal-title" :title="editingCategory ? 'Edit category' : 'New category'" size="narrow" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="category-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="nameInputRef" v-model="formName" label="Name" type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
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

const modalOpen = ref(false);
const editingCategory = ref<CategoryModalRow | null>(null);
const formName = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);

function openCreate() {
  editingCategory.value = null;
  formName.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(cat: CategoryModalRow) {
  editingCategory.value = cat;
  formName.value = cat.name;
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editingCategory.value = null;
  formName.value = '';
  formError.value = '';
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  formError.value = '';
  formSaving.value = true;
  try {
    if (editingCategory.value) {
      await updateCategory(editingCategory.value.documentId, { name });
    } else {
      await createCategory({ name });
    }
    const resetPage = editingCategory.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save category.');
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
