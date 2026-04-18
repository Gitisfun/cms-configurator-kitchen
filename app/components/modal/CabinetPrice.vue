<template>
  <BaseModal v-model="modalOpen" title-id="cabinet-price-modal-title" :title="editing ? 'Edit cabinet price' : 'New cabinet price'" size="medium" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
    <form id="cabinet-price-modal-form" @submit.prevent="submitModal">
      <BaseInputField ref="priceInputRef" v-model="formPrice" label="Price" required-mark type="number" name="price" step="0.01" min="0" required :disabled="formSaving" />

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton type="submit" form="cabinet-price-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
        {{ formSaving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { createCabinetPrice, updateCabinetPrice, type CabinetPrice } from '../../services/cabinet-prices';
import type { CabinetVariant } from '../../services/cabinet-variants';
import type { PriceClass } from '../../services/price-classes';

export type CabinetPriceModalRow = CabinetPrice;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const modalOpen = ref(false);
const editing = ref<CabinetPriceModalRow | null>(null);
const formPrice = ref('');
const formError = ref('');
const formSaving = ref(false);
const priceInputRef = ref<{ focus: () => void } | null>(null);

/** Set only when opening create via `openCreateForVariantAndPriceClass` (catalog matrix or admin page pickers). */
const createCabinetVariantNumericId = ref<number | null>(null);
const createPriceClassNumericId = ref<number | null>(null);

/** Open create with variant and price class fixed in the background (e.g. catalog matrix cell). */
function openCreateForVariantAndPriceClass(variant: CabinetVariant, priceClass: PriceClass) {
  editing.value = null;
  createCabinetVariantNumericId.value = variant.id;
  createPriceClassNumericId.value = priceClass.id;
  formPrice.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => priceInputRef.value?.focus());
}

function openEdit(row: CabinetPriceModalRow) {
  editing.value = row;
  createCabinetVariantNumericId.value = null;
  createPriceClassNumericId.value = null;
  formPrice.value = String(row.price);
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => priceInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  createCabinetVariantNumericId.value = null;
  createPriceClassNumericId.value = null;
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const price = Number(formPrice.value);
  if (!Number.isFinite(price) || price < 0) { formError.value = 'Please enter a valid price.'; return; }

  if (
    !editing.value
    && (createCabinetVariantNumericId.value == null || createPriceClassNumericId.value == null)
  ) {
    formError.value = 'Missing variant or price class. Close and use Add price after selecting both.';
    return;
  }

  formError.value = '';
  const body: Record<string, unknown> = { price };

  if (!editing.value) {
    body.cabinetVariantId = createCabinetVariantNumericId.value;
    body.priceClassId = createPriceClassNumericId.value;
  }

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetPrice(editing.value.documentId, body);
    } else {
      await createCabinetPrice(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save cabinet price.');
  } finally {
    formSaving.value = false;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) { document.removeEventListener('keydown', escKeyHandler); escKeyHandler = null; }
  if (open) {
    escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formSaving.value) closeModal();
    };
    document.addEventListener('keydown', escKeyHandler);
  }
});

onUnmounted(() => {
  if (import.meta.client && escKeyHandler) document.removeEventListener('keydown', escKeyHandler);
});

defineExpose({ openCreateForVariantAndPriceClass, openEdit });
</script>

