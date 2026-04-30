<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="front-modal-title" :title="editingFront ? 'Edit front' : 'New front'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="front-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField v-model="formCode" label="Code" spaced type="text" name="code" autocomplete="off" maxlength="255" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField label="Description" spaced>
          <textarea
            v-model="formDescription"
            class="front-modal__textarea"
            name="description"
            rows="4"
            maxlength="10000"
            placeholder="Optional"
            :disabled="formSaving"
          />
        </BaseInputField>
        <div class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label"> Price class </span>
          <select v-model="formPriceClassIdRaw" class="front-modal__select cms-native-select" :disabled="formSaving || priceClassesLoading">
            <option value="">— None —</option>
            <option v-for="pc in priceClassOptions" :key="pc.documentId" :value="String(pc.id)">
              {{ pc.name }} (level {{ pc.level }})
            </option>
          </select>
          <p v-if="priceClassLoadError" class="base-modal__error">{{ priceClassLoadError }}</p>
        </div>
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
        <BaseButton type="submit" form="front-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractFrontPriceClass } from '../../utils/frontPriceClass';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createFront, getAllPriceClasses, updateFront, type Front } from '../../services';
import type { PriceClass } from '../../services/price-classes';

export type FrontModalRow = Front;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const toast = useToast();

const modalOpen = ref(false);
const editingFront = ref<FrontModalRow | null>(null);
const formName = ref('');
const formCode = ref('');
const formDescription = ref('');
const formPriceClassIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const priceClassOptions = ref<PriceClass[]>([]);
const priceClassesLoading = ref(false);
const priceClassLoadError = ref('');

const rowImage = computed(() => {
  const row = editingFront.value;
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

async function loadPriceClassesIfNeeded() {
  if (priceClassOptions.value.length > 0 || priceClassesLoading.value) return;
  priceClassLoadError.value = '';
  priceClassesLoading.value = true;
  try {
    const res = await getAllPriceClasses(1, 200);
    priceClassOptions.value = res.data;
  } catch {
    priceClassLoadError.value = 'Could not load price classes.';
  } finally {
    priceClassesLoading.value = false;
  }
}

function openCreate() {
  editingFront.value = null;
  formName.value = '';
  formCode.value = '';
  formDescription.value = '';
  formPriceClassIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadPriceClassesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function openEdit(row: FrontModalRow) {
  editingFront.value = row;
  formName.value = row.name;
  formCode.value = row.code?.trim() ? row.code : '';
  formDescription.value = row.description ?? '';
  const pc = extractFrontPriceClass(row);
  formPriceClassIdRaw.value = pc.id != null ? String(pc.id) : '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadPriceClassesIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editingFront.value = null;
  formName.value = '';
  formCode.value = '';
  formDescription.value = '';
  formPriceClassIdRaw.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }
  formError.value = '';
  const desc = String(formDescription.value ?? '').trim();
  const body: Record<string, unknown> = {
    name,
    code: String(formCode.value ?? '').trim() || null,
    description: desc || null,
  };

  const rawPc = formPriceClassIdRaw.value.trim();
  if (rawPc === '') {
    body.priceClassId = null;
  } else {
    const n = Number(rawPc);
    if (!Number.isInteger(n)) {
      formError.value = 'Choose a valid price class.';
      return null;
    }
    body.priceClassId = n;
  }

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingFront.value === null;
  formSaving.value = true;
  try {
    if (editingFront.value) {
      await updateFront(editingFront.value.documentId, body);
    } else {
      await createFront(body);
    }
    formSaving.value = false;
    toast.success(resetPage ? 'Front created.' : 'Front updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save front.');
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

.front-modal__textarea {
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
  min-height: 5rem;
}

.front-modal__textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.front-modal__textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
