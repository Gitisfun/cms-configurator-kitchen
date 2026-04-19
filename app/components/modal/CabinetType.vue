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
        <BaseInputField v-model="formDepthSurchargeCode" label="Depth surcharge code" type="text" name="depthSurchargeCode" autocomplete="off" maxlength="50" :disabled="formSaving" spaced />

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
          <p v-if="!editing" class="ct-modal__hint">
            Save this cabinet type with the button at the bottom, then edit the type again — the Add button will work once the type exists.
          </p>
          <template v-if="editing">
            <div v-if="depthOptionsListed.length > 0" class="ct-modal__depth-matrix-wrap">
              <table class="ct-modal__depth-matrix">
                <thead>
                  <tr>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-name">Name</th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-mm">
                      Width <span class="ct-modal__depth-matrix__th-sub">(mm)</span>
                    </th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-act" aria-label="Edit"></th>
                    <th scope="col" class="ct-modal__depth-matrix__th ct-modal__depth-matrix__th-act" aria-label="Remove"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="opt in depthOptionsListed" :key="opt.documentId" class="ct-modal__depth-matrix__row">
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-name">{{ opt.name }}</td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-mm">{{ opt.depth }} mm</td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-act">
                      <BaseButton type="button" variant="text" size="sm" :disabled="formSaving || deletingDepthDocumentId !== null" @click="openEditDepthOption(opt)">
                        Edit
                      </BaseButton>
                    </td>
                    <td class="ct-modal__depth-matrix__td ct-modal__depth-matrix__td-act">
                      <BaseButton
                        type="button"
                        variant="text"
                        danger
                        size="sm"
                        :disabled="formSaving || deletingDepthDocumentId !== null"
                        :loading="deletingDepthDocumentId === opt.documentId"
                        @click="confirmUnlinkDepthOption(opt)"
                      >
                        Unlink
                      </BaseButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="ct-modal__hint">No depth options for this type yet.</p>
          </template>
          <div class="ct-modal__depth-actions">
            <BaseButton
              type="button"
              variant="outlined"
              size="sm"
              :disabled="formSaving || !editing || deletingDepthDocumentId !== null"
              :title="!editing ? 'Save this cabinet type first, then edit it again to add depths' : undefined"
              @click="openAddDepthOption"
            >
              <Icon name="lucide:plus" class="base-btn__icon" />
              Link depth option
            </BaseButton>
          </div>
        </div>

        <div class="ct-modal__field ct-modal__field--spaced">
          <span class="ct-modal__label">Subcategory</span>
          <select v-model="formSubcategoryIdRaw" class="ct-modal__select" :disabled="formSaving || subcategoriesLoading">
            <option value="">— None —</option>
            <option v-for="sc in subcategoryOptions" :key="sc.documentId" :value="String(sc.id)">
              {{ sc.name }}
            </option>
          </select>
        </div>

        <div v-if="!editing" class="ct-modal__field ct-modal__field--spaced">
          <span class="ct-modal__label">Cabinet series</span>
          <select v-model="formCabinetSeriesIdRaw" class="ct-modal__select" :disabled="formSaving || seriesLoading">
            <option value="">— None —</option>
            <option v-for="s in seriesOptions" :key="s.documentId" :value="String(s.id)">
              {{ s.name }} ({{ s.code }})
            </option>
          </select>
        </div>

        <BaseInputField label="Image" spaced>
          <div class="ct-image-row">
            <div class="ct-image-preview">
              <img v-if="modalImagePreview" :src="modalImagePreview" alt="" class="ct-image-preview__img" loading="lazy" />
              <div v-else class="ct-image-preview__placeholder">
                <Icon name="lucide:image" />
                <span>No image</span>
              </div>
            </div>
            <div class="ct-image-actions">
              <input ref="imageFileInputRef" type="file" accept="image/*" class="visually-hidden" tabindex="-1" aria-hidden="true" @change="onImageFile" />
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving || uploadingImage" :loading="uploadingImage" @click="imageFileInputRef?.click()">
                {{ uploadingImage ? 'Uploading…' : 'Upload' }}
              </BaseButton>
              <BaseButton type="button" variant="outlined" size="sm" :disabled="formSaving" @click="openMediaPicker"> From library </BaseButton>
              <BaseButton v-if="canRemoveImage" type="button" variant="text" danger size="sm" :disabled="formSaving" @click="clearImage"> Remove </BaseButton>
            </div>
          </div>
        </BaseInputField>

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
    <ModalMedia v-model="mediaPickerOpen" @select="onMediaPickerSelect" />
  </div>
</template>

<script setup lang="ts">
import type { MediaPickerFile } from './Media.vue';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { createCabinetType, getCabinetTypeById, updateCabinetType, type CabinetType } from '../../services/cabinet-types';
import { updateDepthOption, type DepthOption } from '../../services/depth-options';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import { getAllSubcategories, type Subcategory } from '../../services/subcategories';
import { getAllCabinetSeries, type CabinetSeries } from '../../services/cabinet-series';
import { uploadMedia, parseUploadResponseId } from '../../services/upload';

export type CabinetTypeModalRow = CabinetType;

const emit = defineEmits<{
  saved: [payload: { resetPage: boolean }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const modalOpen = ref(false);
const editing = ref<CabinetTypeModalRow | null>(null);
const formName = ref('');
const formDescription = ref('');
const formOrderNumberPrefix = ref('');
const formDepthSurchargeCode = ref('');
const formHasLeftRight = ref(false);
const formHasInternalPanel = ref(false);
/** When true, show the depth options list and add button (same row style as L/R / panel). */
const formShowDepthOptions = ref(false);
const formSubcategoryIdRaw = ref('');
const formCabinetSeriesIdRaw = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<{ focus: () => void } | null>(null);
const imageFileInputRef = ref<HTMLInputElement | null>(null);

const formImageId = ref<number | null>(null);
const formImageTouched = ref(false);
const imagePreviewUrlOverride = ref<string | null>(null);
let blobPreviewUrl: string | null = null;
const uploadingImage = ref(false);
const mediaPickerOpen = ref(false);

const subcategoryOptions = ref<Subcategory[]>([]);
const subcategoriesLoading = ref(false);
const seriesOptions = ref<CabinetSeries[]>([]);
const seriesLoading = ref(false);

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

const modalImagePreview = computed(() => {
  if (imagePreviewUrlOverride.value) return imagePreviewUrlOverride.value;
  if (formImageTouched.value && formImageId.value === null) return null;
  const row = editing.value;
  if (row && !formImageTouched.value) return extractPlinthImage(row, strapiPublicUrl.value).src;
  return null;
});

const canRemoveImage = computed(() => {
  if (modalImagePreview.value) return true;
  const row = editing.value;
  if (row && !formImageTouched.value) return extractPlinthImage(row, strapiPublicUrl.value).id != null;
  return false;
});

function revokeBlobPreview() {
  if (blobPreviewUrl) {
    URL.revokeObjectURL(blobPreviewUrl);
    if (imagePreviewUrlOverride.value === blobPreviewUrl) imagePreviewUrlOverride.value = null;
    blobPreviewUrl = null;
  }
}

function resetImageFormState() {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  formImageId.value = null;
  formImageTouched.value = false;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
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
  if (!window.confirm(`Unlink depth option "${opt.name}" from this cabinet type? The row stays in the library.`)) return;
  if (!editing.value) return;
  deletingDepthDocumentId.value = opt.documentId;
  try {
    await updateDepthOption(opt.documentId, {
      disconnectCabinetTypeDocumentIds: [editing.value.documentId],
    });
    await refreshEditingCabinetTypeFromServer();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to unlink depth option.'));
  } finally {
    deletingDepthDocumentId.value = null;
  }
}

async function loadRelationsIfNeeded() {
  if (subcategoryOptions.value.length === 0 && !subcategoriesLoading.value) {
    subcategoriesLoading.value = true;
    try { subcategoryOptions.value = (await getAllSubcategories(1, 200)).data; } catch { /* ignore */ }
    finally { subcategoriesLoading.value = false; }
  }
  if (!editing.value && seriesOptions.value.length === 0 && !seriesLoading.value) {
    seriesLoading.value = true;
    try { seriesOptions.value = (await getAllCabinetSeries(1, 200)).data; } catch { /* ignore */ }
    finally { seriesLoading.value = false; }
  }
}

async function onImageFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { formError.value = 'Please choose an image file.'; input.value = ''; return; }
  formError.value = '';
  uploadingImage.value = true;
  try {
    const fd = new FormData();
    fd.append('files', file);
    const raw = await uploadMedia(fd);
    const first = parseUploadResponseId(raw);
    if (!first) { formError.value = 'Upload did not return a file id.'; return; }
    formImageId.value = first.id;
    formImageTouched.value = true;
    revokeBlobPreview();
    blobPreviewUrl = URL.createObjectURL(file);
    imagePreviewUrlOverride.value = blobPreviewUrl;
  } catch { formError.value = 'Upload failed.'; }
  finally { uploadingImage.value = false; input.value = ''; }
}

function clearImage() {
  formImageId.value = null;
  formImageTouched.value = true;
  revokeBlobPreview();
  imagePreviewUrlOverride.value = null;
  if (imageFileInputRef.value) imageFileInputRef.value.value = '';
}

function openMediaPicker() { if (!formSaving.value) mediaPickerOpen.value = true; }

function onMediaPickerSelect(f: MediaPickerFile) {
  revokeBlobPreview();
  imagePreviewUrlOverride.value = f.thumbnail || f.url;
  formImageId.value = f.id;
  formImageTouched.value = true;
}

function openCreate() {
  editing.value = null;
  formName.value = '';
  formDescription.value = '';
  formOrderNumberPrefix.value = '';
  formDepthSurchargeCode.value = '';
  formHasLeftRight.value = false;
  formHasInternalPanel.value = false;
  formShowDepthOptions.value = false;
  formSubcategoryIdRaw.value = '';
  formCabinetSeriesIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadRelationsIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

/** Pre-select cabinet series (numeric Strapi id) when creating from the catalog workspace. */
function openCreateForSeries(cabinetSeriesNumericId: number) {
  openCreate();
  formCabinetSeriesIdRaw.value = String(cabinetSeriesNumericId);
}

function openEdit(row: CabinetTypeModalRow) {
  editing.value = row;
  formName.value = row.name;
  formDescription.value = row.description ?? '';
  formOrderNumberPrefix.value = row.orderNumberPrefix ?? '';
  formDepthSurchargeCode.value = row.depthSurchargeCode ?? '';
  formHasLeftRight.value = row.hasLeftRight;
  formHasInternalPanel.value = row.hasInternalPanel;
  formShowDepthOptions.value = strapiRelationList(row.depthOptions).length > 0;
  const scId = extractRelationNumericId(row.subcategory);
  formSubcategoryIdRaw.value = scId != null ? String(scId) : '';
  formCabinetSeriesIdRaw.value = '';
  formError.value = '';
  resetImageFormState();
  modalOpen.value = true;
  void loadRelationsIfNeeded();
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  mediaPickerOpen.value = false;
  resetImageFormState();
  modalOpen.value = false;
  editing.value = null;
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) { formError.value = 'Please enter a name.'; return; }

  formError.value = '';
  const body: Record<string, unknown> = {
    name,
    description: formDescription.value.trim() || null,
    orderNumberPrefix: formOrderNumberPrefix.value.trim() || null,
    depthSurchargeCode: formDepthSurchargeCode.value.trim() || null,
    hasLeftRight: formHasLeftRight.value,
    hasInternalPanel: formHasInternalPanel.value,
  };

  const rawSc = formSubcategoryIdRaw.value.trim();
  body.subcategoryId = rawSc ? Number(rawSc) : null;
  if (!editing.value) {
    const rawCs = formCabinetSeriesIdRaw.value.trim();
    body.cabinetSeriesId = rawCs ? Number(rawCs) : null;
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
    closeModal();
    emit('saved', { resetPage });
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save cabinet type.');
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
      if (e.key !== 'Escape' || formSaving.value) return;
      if (mediaPickerOpen.value) { mediaPickerOpen.value = false; return; }
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
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

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
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
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

.ct-modal__checkbox-label input[type="checkbox"] {
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
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
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

.ct-image-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .ct-image-row { flex-direction: row; align-items: flex-start; }
}

.ct-image-preview {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ct-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ct-image-preview__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-small);
  text-align: center;
}

.ct-image-preview__placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.6;
}

.ct-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
</style>
