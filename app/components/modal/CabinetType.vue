<template>
  <div>
    <BaseModal v-model="modalOpen" title-id="cabinet-type-modal-title" :title="editing ? 'Edit cabinet type' : 'New cabinet type'" size="wide" :close-disabled="formSaving" :close-on-backdrop="!formSaving">
      <form id="cabinet-type-modal-form" @submit.prevent="submitModal">
        <BaseInputField ref="nameInputRef" v-model="formName" label="Name" required-mark type="text" name="name" autocomplete="off" maxlength="255" required :disabled="formSaving" />
        <BaseInputField label="Description" spaced>
          <textarea
            v-model="formDescription"
            class="ct-modal__textarea"
            name="description"
            rows="5"
            maxlength="10000"
            placeholder="e.g. Tall unit for integrated refrigerator&#10;1 three-part door&#10;1 niche 880 mm with front&#10;9 shelves shortened&#10;4 door shelves for shoes"
            :disabled="formSaving"
          />
          <p class="ct-modal__hint">Include all features: door types, niches, shelves, compartments, etc.</p>
        </BaseInputField>
        <BaseInputField v-model="formOrderNumberPrefix" label="Order number prefix" type="text" name="orderNumberPrefix" autocomplete="off" maxlength="50" :disabled="formSaving" spaced />

        <div class="ct-modal__checks">
          <label class="ct-modal__checkbox-label">
            <input v-model="formHasLeftRight" type="checkbox" :disabled="formSaving" />
            <span>Has left/right</span>
          </label>
          <label class="ct-modal__checkbox-label">
            <input v-model="formHasInternalPanel" type="checkbox" :disabled="formSaving" />
            <span>Has internal panel</span>
          </label>
          <label class="ct-modal__checkbox-label">
            <input v-model="formShowDepthOptions" type="checkbox" :disabled="formSaving" />
            <span>Has depth options</span>
          </label>
        </div>

        <div v-if="formShowDepthOptions" class="ct-modal__field ct-modal__field--spaced ct-modal__depth-section">
          <span class="ct-modal__label">Depth options</span>
          <p v-if="!editing" class="ct-modal__hint">Save this cabinet type with the button at the bottom, then edit the type again — the Add button will work once the type exists.</p>
          <template v-if="editing">
            <div v-if="depthOptionsListed.length > 0" class="ct-modal__depth-matrix-wrap">
              <table class="ct-modal__depth-matrix">
                <thead>
                  <tr>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-name">Name</th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-mm">Width <span class="ct-modal__depth-matrix__th-sub">(mm)</span></th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-act" aria-label="Edit"></th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-act" aria-label="Remove"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="opt in depthOptionsListed" :key="opt.documentId" class="ct-modal__depth-matrix__row">
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-name">{{ opt.name }}</td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-mm">{{ opt.depth }} mm</td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-act">
                      <BaseButton type="button" variant="text" size="sm" :disabled="formSaving || deletingDepthDocumentId !== null" @click="openEditDepthOption(opt)"> Edit </BaseButton>
                    </td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-act">
                      <BaseButton type="button" variant="text" danger size="sm" :disabled="formSaving || deletingDepthDocumentId !== null" :loading="deletingDepthDocumentId === opt.documentId" @click="confirmUnlinkDepthOption(opt)"> Unlink </BaseButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="ct-modal__hint">No depth options for this type yet.</p>
          </template>
          <div class="ct-modal__depth-actions">
            <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving || !editing || deletingDepthDocumentId !== null" :title="!editing ? 'Save this cabinet type first, then edit it again to add depths' : undefined" @click="openAddDepthOption">
              <Icon name="lucide:plus" class="base-btn__icon" />
              Link depth option
            </BaseButton>
          </div>
        </div>

        <BaseImageUpload ref="imageFieldRef" v-model:image-id="formImageId" v-model:image-touched="formImageTouched" :row-preview-url="rowImage.src" :row-image-id="rowImage.id" :disabled="formSaving" @error="onImageFieldError" />

        <p v-if="formError" class="base-modal__error">{{ formError }}</p>
      </form>
      <template #footer>
        <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
        <BaseButton type="submit" form="cabinet-type-modal-form" variant="primary" :disabled="formSaving" :loading="formSaving">
          {{ formSaving ? 'Saving…' : 'Save' }}
        </BaseButton>
      </template>
    </BaseModal>

    <ModalDepthOption ref="depthOptionModalRef" @saved="onDepthOptionSaved" />
    <ModalDepthOptionLink ref="depthOptionLinkRef" @linked="onDepthOptionLinked" />
  </div>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createCabinetType, getCabinetTypeById, updateCabinetType, type CabinetType } from '../../services/cabinet-types';
import { updateDepthOption, type DepthOption } from '../../services/depth-options';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';

export type CabinetTypeModalRow = CabinetType;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();

const modalOpen = ref(false);
const editing = ref<CabinetTypeModalRow | null>(null);
const formName = ref('');
const formDescription = ref('');
const formOrderNumberPrefix = ref('');
const formHasLeftRight = ref(false);
const formHasInternalPanel = ref(false);
/** When true, show the depth options list and add button (same row style as L/R / panel). */
const formShowDepthOptions = ref(false);
/** When adding a type from a series catalog page; not shown in the form. */
const createCabinetSeriesNumericId = ref<number | null>(null);
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFieldRef = ref<{ reset: () => void; attemptCloseMediaPicker: () => boolean } | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);

const depthOptionModalRef = ref<{
  openEdit: (row: DepthOption, fallbackCabinetTypeNumericId?: number | null) => void;
} | null>(null);

const depthOptionLinkRef = ref<{
  openPicker: (cabinetTypeDocumentId: string, linkedDocumentIds: string[], label?: string) => void;
} | null>(null);

/** Set while a depth row delete is in flight (disables sibling actions). */
const deletingDepthDocumentId = ref<string | null>(null);

const depthOptionsListed = computed(() => {
  if (!editing.value) return [];
  return [...strapiRelationList(editing.value.depthOptions)].sort((a, b) => a.depth - b.depth);
});

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

function openAddDepthOption() {
  if (!editing.value) return;
  depthOptionLinkRef.value?.openPicker(
    editing.value.documentId,
    depthOptionsListed.value.map((d) => d.documentId),
    editing.value.name,
  );
}

function openEditDepthOption(opt: DepthOption) {
  depthOptionModalRef.value?.openEdit(opt);
}

async function refreshEditingCabinetTypeFromServer() {
  emit('saved', { resetPage: false });
  if (!editing.value) return;
  try {
    const res = await getCabinetTypeById(editing.value.documentId);
    editing.value = res.data;
    if (strapiRelationList(editing.value.depthOptions).length > 0) {
      formShowDepthOptions.value = true;
    }
  } catch {
    /* keep previous editing row */
  }
}

async function onDepthOptionSaved(_payload: { resetPage: boolean }) {
  await refreshEditingCabinetTypeFromServer();
}

async function onDepthOptionLinked() {
  await refreshEditingCabinetTypeFromServer();
}

async function confirmUnlinkDepthOption(opt: DepthOption) {
  const ok = await requestConfirm({
    title: 'Unlink depth option?',
    message: `Unlink depth option "${opt.name}" from this cabinet type? The row stays in the library.`,
    confirmLabel: 'Unlink',
  });
  if (!ok) return;
  if (!editing.value) return;
  deletingDepthDocumentId.value = opt.documentId;
  try {
    await updateDepthOption(opt.documentId, {
      disconnectCabinetTypeDocumentIds: [editing.value.documentId],
    });
    await refreshEditingCabinetTypeFromServer();
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to unlink depth option.'));
  } finally {
    deletingDepthDocumentId.value = null;
  }
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formDescription.value = '';
  formOrderNumberPrefix.value = '';
  formHasLeftRight.value = false;
  formHasInternalPanel.value = false;
  formShowDepthOptions.value = false;
  createCabinetSeriesNumericId.value = null;
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

/** Attach new type to this series when creating from the catalog workspace (no series field in the form). */
function openCreateForSeries(cabinetSeriesNumericId: number) {
  openCreate();
  createCabinetSeriesNumericId.value = cabinetSeriesNumericId;
}

function openEdit(row: CabinetTypeModalRow) {
  editing.value = row;
  formName.value = row.name;
  formDescription.value = row.description ?? '';
  formOrderNumberPrefix.value = row.orderNumberPrefix ?? '';
  formHasLeftRight.value = row.hasLeftRight;
  formHasInternalPanel.value = row.hasInternalPanel;
  formShowDepthOptions.value = strapiRelationList(row.depthOptions).length > 0;
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
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    description: formDescription.value.trim() || null,
    orderNumberPrefix: formOrderNumberPrefix.value.trim() || null,
    depthSurchargeCode: null,
    hasLeftRight: formHasLeftRight.value,
    hasInternalPanel: formHasInternalPanel.value,
  };

  if (!editing.value) {
    body.cabinetSeriesId = createCabinetSeriesNumericId.value;
  } else {
    /** Re-send series id so Strapi does not drop the many-to-one link on update (catalog relies on it). */
    const seriesId = extractRelationNumericId(editing.value.cabinetSeries);
    if (seriesId != null) {
      body.cabinetSeriesId = seriesId;
    }
  }

  if (formImageTouched.value) body.imageId = formImageId.value;

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetType(editing.value.documentId, body);
    } else {
      await createCabinetType(body);
    }
    const resetPage = editing.value === null;
    formSaving.value = false;
    toast.success(resetPage ? 'Cabinet type created.' : 'Cabinet type updated.');
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    const msg = getFetchErrorMessage(e, 'Could not save cabinet type.');
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
  if (import.meta.client && escKeyHandler) document.removeEventListener('keydown', escKeyHandler);
});

defineExpose({ openCreate, openCreateForSeries, openEdit });
</script>

<style scoped>
.ct-modal__field {
  display: flex;
  flex-direction: column;
}

.ct-modal__field--spaced {
  margin-top: 1rem;
}

.ct-modal__label {
  display: block;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin-bottom: 0.375rem;
}

.ct-modal__select {
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

.ct-modal__select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.ct-modal__select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ct-modal__textarea {
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

.ct-modal__textarea:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.ct-modal__textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ct-modal__hint {
  margin-top: 0.375rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.ct-modal__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
}

.ct-modal__checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-primary);
  cursor: pointer;
}

.ct-modal__checkbox-label input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
}

/* Catalog-style compact matrix (aligned with product catalog tables) */
.ct-modal__depth-matrix-wrap {
  margin-top: 0.375rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
}

.ct-modal__depth-matrix {
  width: 100%;
  min-width: min(100%, 22rem);
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.75rem;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-feature-settings: 'tnum' 1;
}

.ct-modal__depth-matrix__th,
.ct-modal__depth-matrix__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.35rem 0.45rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.ct-modal__depth-matrix__th:last-child,
.ct-modal__depth-matrix__td:last-child {
  border-right: none;
}

.ct-modal__depth-matrix tbody tr:last-child .ct-modal__depth-matrix__td {
  border-bottom: none;
}

.ct-modal__depth-matrix__row:hover .ct-modal__depth-matrix__td {
  background: var(--color-surface-hover);
}

.ct-modal__depth-matrix thead .ct-modal__depth-matrix__th {
  background: var(--color-surface-card);
}

.ct-modal__depth-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: left;
  white-space: nowrap;
}

.ct-modal__depth-matrix__th-sub {
  display: block;
  font-size: 0.65rem;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}

.ct-modal__depth-matrix__th-name {
  width: 62%;
  min-width: 10rem;
}

.ct-modal__depth-matrix__th-mm {
  width: 4.75rem;
  max-width: 5.5rem;
  text-align: right;
}

.ct-modal__depth-matrix__th-act {
  width: 1%;
  text-align: right;
  font-size: 0.7rem;
}

.ct-modal__depth-matrix__td-name {
  min-width: 0;
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
  word-break: break-word;
}

.ct-modal__depth-matrix__td-mm {
  text-align: right;
  white-space: nowrap;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  width: 4.75rem;
  max-width: 5.5rem;
}

.ct-modal__depth-matrix__td-act {
  text-align: right;
  white-space: nowrap;
}

.ct-modal__depth-matrix__td-act :deep(.base-btn) {
  font-size: 0.78rem;
}

.ct-modal__depth-actions {
  margin-top: 0.75rem;
}

.ct-modal__depth-section {
  padding-left: 0.125rem;
}
</style>
