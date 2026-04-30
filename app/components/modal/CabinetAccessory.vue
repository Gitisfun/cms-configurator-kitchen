<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="cabinet-accessory-modal-title" :title="editing ? 'Edit accessory' : 'New accessory'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="cabinet-accessory-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField label="Description" spaced>
          <textarea
            v-model="formDescription"
            class="ca-modal__textarea"
            name="description"
            rows="3"
            maxlength="10000"
            placeholder="Optional"
            :disabled="formSaving"
          />
        </BaseInputField>
        <BaseInputField v-model="formPrice" label="Price" required-mark type="number" name="price" step="0.01" min="0" required :disabled="formSaving" spaced />

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
        <BaseButton type="submit" form="cabinet-accessory-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createCabinetAccessory, updateCabinetAccessory, type CabinetAccessory } from '../../services/cabinet-accessories';

export type CabinetAccessoryModalRow = CabinetAccessory;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const toast = useToast();

const modalOpen = ref(false);
const editing = ref<CabinetAccessoryModalRow | null>(null);
const formName = ref('');
const formDescription = ref('');
const formPrice = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const rowImage = computed(() => {
  const row = editing.value;
  if (!row) return { src: null as string | null, id: null as number | null };
  const ex = extractPlinthImage(row, strapiPublicUrl.value);
  return { src: ex.src, id: ex.id };
});

function resetImageFormState() {
  imageFieldRef.value?.reset();
}

function onImageFieldError(message: string) {
  formError.value = message;
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formDescription.value = '';
  formPrice.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: CabinetAccessoryModalRow) {
  editing.value = row;
  formName.value = row.name;
  formDescription.value = row.description ?? '';
  formPrice.value = row.price != null ? String(row.price) : '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) { formError.value = 'Please enter a name.'; return; }
  const price = Number(formPrice.value);
  if (!Number.isFinite(price) || price < 0) { formError.value = 'Please enter a valid price.'; return; }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    description: formDescription.value.trim() || null,
    price,
  };

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetAccessory(editing.value.documentId, body);
    } else {
      await createCabinetAccessory(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    toast.success(resetPage ? 'Accessory created.' : 'Accessory updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save accessory.');
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
      if (e.key !== 'Escape' || formSaving.value) return;
      if (imageFieldRef.value?.attemptCloseMediaPicker()) return;
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
.ca-modal__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  resize: vertical;
  min-height: 4rem;
}

.ca-modal__textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.ca-modal__textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
