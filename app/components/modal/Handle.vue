<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="handle-modal-title" :title="editingHandle ? 'Edit handle' : 'New handle'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="handle-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseImageUpload
          ref="imageFieldRef"
          v-model:image-id="formImageId"
          v-model:image-touched="formImageTouched"
          :row-preview-url="rowImage.src"
          :row-image-id="rowImage.id"
          :disabled="formSaving"
          @error="onImageFieldError"
        />
        <div class="front-modal__field front-modal__field--spaced">
          <span class="front-modal__label"> Handle position </span>
          <select v-model="formHandlePositionIdRaw" class="front-modal__select" :disabled="formSaving || handlePositionsLoading">
            <option value="">— None —</option>
            <option v-for="hp in handlePositionOptions" :key="hp.documentId" :value="String(hp.id)">
              {{ hp.name }}
            </option>
          </select>
          <p v-if="handlePositionLoadError" class="base-modal__error">{{ handlePositionLoadError }}</p>
        </div>
        <BaseInputField v-model="formColor" label="Color" spaced type="text" name="color" maxlength="255" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField v-model="formPrice" label="Price" spaced type="text" name="price" inputmode="decimal" placeholder="Optional" :disabled="formSaving" />
        <BaseInputField v-model="formPosition" label="Sort position" required-mark spaced type="text" name="position" inputmode="numeric" placeholder="0" required :disabled="formSaving" />
        <BaseInputField label="Has hold" spaced>
          <label class="handle-checkbox">
            <input v-model="formHasHold" type="checkbox" class="handle-checkbox__input" :disabled="formSaving" />
            <span class="handle-checkbox__label">Yes</span>
          </label>
        </BaseInputField>
        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="handle-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractHandlePositionRelation } from '../../utils/handlePositionRelation';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import {
  createHandle,
  getAllHandlePositions,
  updateHandle,
  type Handle,
} from '../../services';
import type { HandlePosition } from '../../services/handle-positions';

export type HandleModalRow = Handle;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editingHandle = ref<HandleModalRow | null>(null);
const formName = ref('');
const formPrice = ref('');
const formColor = ref('');
const formPosition = ref('0');
const formHasHold = ref(false);
const formHandlePositionIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const handlePositionOptions = ref<HandlePosition[]>([]);
const handlePositionsLoading = ref(false);
const handlePositionLoadError = ref('');

const rowImage = computed(() => {
  const row = editingHandle.value;
  if (!row) return { src: null as string | null, id: null as number | null };
  const ex = extractPlinthImage(row, strapiPublicUrl.value);
  return { src: ex.src, id: ex.id };
});

async function loadHandlePositionsIfNeeded() {
  if (handlePositionOptions.value.length > 0 || handlePositionsLoading.value) return;
  handlePositionLoadError.value = '';
  handlePositionsLoading.value = true;
  try {
    const res = await getAllHandlePositions(1, 200);
    handlePositionOptions.value = res.data;
  } catch {
    handlePositionLoadError.value = 'Could not load handle positions.';
  } finally {
    handlePositionsLoading.value = false;
  }
}

function resetImageFormState() {
  imageFieldRef.value?.reset();
}

function onImageFieldError(message: string) {
  formError.value = message;
}

function openCreate() {
  editingHandle.value = null;
  formName.value = '';
  formPrice.value = '';
  formColor.value = '';
  formPosition.value = '0';
  formHasHold.value = false;
  formHandlePositionIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadHandlePositionsIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function priceToFormString(price: HandleModalRow['price']): string {
  if (price == null) return '';
  if (typeof price === 'number' && Number.isFinite(price)) return String(price);
  if (typeof price === 'string') {
    const t = price.trim();
    return t === '' ? '' : t;
  }
  return '';
}

function openEdit(row: HandleModalRow) {
  editingHandle.value = row;
  formName.value = row.name;
  formPrice.value = priceToFormString(row.price);
  formColor.value = row.color?.trim() ? row.color : '';
  formPosition.value = String(row.position ?? 0);
  formHasHold.value = row.hasHold === true;
  const hp = extractHandlePositionRelation(row);
  formHandlePositionIdRaw.value = hp.id != null ? String(hp.id) : '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadHandlePositionsIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  resetImageFormState();
  modalOpen.value = false;
  editingHandle.value = null;
  formName.value = '';
  formPrice.value = '';
  formColor.value = '';
  formPosition.value = '0';
  formHasHold.value = false;
  formHandlePositionIdRaw.value = '';
  formError.value = '';
}

function buildSubmitBody(): Record<string, unknown> | null {
  const name = String(formName.value ?? '').trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return null;
  }

  const posTrim = String(formPosition.value ?? '').trim();
  if (posTrim === '') {
    formError.value = 'Please enter a sort position (whole number, e.g. 0).';
    return null;
  }
  const pos = Number(posTrim);
  if (!Number.isInteger(pos) || pos < 0) {
    formError.value = 'Sort position must be a whole number ≥ 0.';
    return null;
  }

  const rawHp = formHandlePositionIdRaw.value.trim();
  if (rawHp === '') {
    formError.value = '';
  } else {
    const nHp = Number(rawHp);
    if (!Number.isInteger(nHp)) {
      formError.value = 'Choose a valid handle position.';
      return null;
    }
  }

  formError.value = '';
  const colorTrim = String(formColor.value ?? '').trim();
  const body: Record<string, unknown> = {
    name,
    color: colorTrim === '' ? null : colorTrim,
    hasHold: formHasHold.value,
    position: pos,
  };

  if (rawHp === '') {
    body.handlePositionId = null;
  } else {
    body.handlePositionId = Number(rawHp);
  }

  const priceTrim = String(formPrice.value ?? '').trim();

  if (editingHandle.value) {
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
  } else if (priceTrim !== '') {
    const n = Number(priceTrim);
    if (Number.isNaN(n)) {
      formError.value = 'Enter a valid price or leave empty.';
      return null;
    }
    body.price = n;
  }

  if (formImageTouched.value) {
    body.imageId = formImageId.value;
  }

  return body;
}

async function submitModal() {
  const body = buildSubmitBody();
  if (!body) return;

  const resetPage = editingHandle.value === null;
  formSaving.value = true;
  try {
    if (editingHandle.value) {
      await updateHandle(editingHandle.value.documentId, body);
    } else {
      await createHandle(body);
    }
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save handle.');
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

.handle-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: var(--paragraph-size);
  color: var(--color-text);
}

.handle-checkbox__input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary, #2563eb);
}

.handle-checkbox__input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
