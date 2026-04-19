<template>
  <div>
    <CmsPageHeader title="Cabinet Variants" description="Manage cabinet variants with order numbers and widths. New variants are created for a chosen cabinet type.">
      <template #actions>
        <div class="cabinet-variants-page__create">
          <label class="cabinet-variants-page__type-label" for="cabinet-variant-type-pick">Cabinet type</label>
          <select
            id="cabinet-variant-type-pick"
            v-model="selectedCabinetTypeIdRaw"
            class="cabinet-variants-page__type-select"
            :disabled="typesLoading || typesLoadError !== ''"
            aria-label="Cabinet type for new variant"
          >
            <option value="">— Select type —</option>
            <option v-for="ct in cabinetTypeOptions" :key="ct.documentId" :value="String(ct.id)">
              {{ ct.name }}
            </option>
          </select>
          <BaseButton type="button" :disabled="!canOpenCreateVariant" @click="openCreateForSelectedType">
            <Icon name="lucide:plus" class="base-btn__icon" />
            Add variant
          </BaseButton>
        </div>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'variant' : 'variants' }}
      </template>
      <template #loading>Loading cabinet variants&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load cabinet variants.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:copy" />
        </div>
        <h3 class="base-panel__empty-title">No cabinet variants yet</h3>
        <p class="base-panel__empty-desc">Create cabinet variants and link them to cabinet types.</p>
        <p v-if="typesLoadError" class="base-panel__empty-desc">{{ typesLoadError }}</p>
        <BaseButton type="button" :disabled="!canOpenCreateVariant" @click="openCreateForSelectedType">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create variant
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No variants on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Order Number</th>
            <th scope="col">Width</th>
            <th scope="col">Height</th>
            <th scope="col">Variable</th>
            <th scope="col">Min Width</th>
            <th scope="col">Max Width</th>
            <th scope="col">Cabinet Type</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:copy" />
              </span>
              <span class="base-table__name-text">{{ row.orderNumber }}</span>
            </div>
          </td>
          <td>{{ row.width }} mm</td>
          <td>{{ row.height != null ? `${row.height} mm` : '—' }}</td>
          <td>{{ row.isVariableWidth ? 'Yes' : 'No' }}</td>
          <td>{{ row.minWidth != null ? `${row.minWidth} mm` : '—' }}</td>
          <td>{{ row.maxWidth != null ? `${row.maxWidth} mm` : '—' }}</td>
          <td>{{ cabinetTypeLabel(row) }}</td>
          <td>{{ formatDate(row.publishedAt) }}</td>
          <td>{{ formatDate(row.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === row.documentId" @click="openEditModal(row)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === row.documentId" @click="confirmDelete(row)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Cabinet variant pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetVariant ref="variantModalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  cabinetVariantsListPath,
  cabinetVariantsListQuery,
  defaultCabinetVariantsResponse,
  deleteCabinetVariant,
  type CabinetVariant,
  type CabinetVariantsResponse,
} from '../services/cabinet-variants';
import { getAllCabinetTypes, type CabinetType } from '../services/cabinet-types';
import { variantHeightLockedFromCabinetTypeRelation } from '../utils/seriesVariantHeight';

const PAGE_SIZE = 25;
const page = ref(1);

const variantModalRef = ref<{
  openCreateForType: (cabinetTypeNumericId: number, options?: { lockVariantHeight?: boolean }) => void;
  openEdit: (row: CabinetVariant, options?: { lockVariantHeight?: boolean }) => void;
} | null>(null);

const cabinetTypeOptions = ref<CabinetType[]>([]);
const typesLoading = ref(false);
const typesLoadError = ref('');
const selectedCabinetTypeIdRaw = ref('');

const canOpenCreateVariant = computed(() => {
  if (typesLoading.value || typesLoadError.value) return false;
  const raw = selectedCabinetTypeIdRaw.value.trim();
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0;
});

const selectedCabinetType = computed((): CabinetType | null => {
  const raw = selectedCabinetTypeIdRaw.value.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return cabinetTypeOptions.value.find((t) => t.id === n) ?? null;
});

const lockVariantHeightForCreate = computed(() =>
  selectedCabinetType.value != null
    ? variantHeightLockedFromCabinetTypeRelation(selectedCabinetType.value)
    : false,
);

onMounted(async () => {
  typesLoading.value = true;
  typesLoadError.value = '';
  try {
    cabinetTypeOptions.value = (await getAllCabinetTypes(1, 500)).data;
  } catch {
    typesLoadError.value = 'Could not load cabinet types. Add variants from a product catalog, or retry.';
  } finally {
    typesLoading.value = false;
  }
});

function openCreateForSelectedType() {
  const n = Number(selectedCabinetTypeIdRaw.value.trim());
  if (!Number.isFinite(n) || n <= 0) return;
  variantModalRef.value?.openCreateForType(n, {
    lockVariantHeight: lockVariantHeightForCreate.value,
  });
}

function openEditModal(row: CabinetVariant) {
  variantModalRef.value?.openEdit(row, {
    lockVariantHeight: variantHeightLockedFromCabinetTypeRelation(row.cabinetType),
  });
}

const { data, pending, error, refresh } = useFetch<CabinetVariantsResponse>(cabinetVariantsListPath, {
  key: computed(() => `cabinet-variants-p${page.value}`),
  query: computed(() => cabinetVariantsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetVariantsResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const deletingDocumentId = ref<string | null>(null);

function cabinetTypeLabel(row: CabinetVariant): string {
  const ct = row.cabinetType;
  if (!ct) return '—';
  if ('name' in ct) return (ct as { name: string }).name;
  if ('data' in ct && ct.data) return ct.data.name;
  return '—';
}

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetVariant) {
  if (!window.confirm(`Delete variant "${row.orderNumber}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetVariant(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete cabinet variant.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>

<style scoped>
.cabinet-variants-page__create {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1rem;
}

.cabinet-variants-page__type-label {
  display: block;
  width: 100%;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin: 0;
}

@media (min-width: 640px) {
  .cabinet-variants-page__type-label {
    width: auto;
    margin-right: 0;
    align-self: center;
    padding-bottom: 0.375rem;
  }
}

.cabinet-variants-page__type-select {
  min-width: 12rem;
  max-width: min(22rem, 100%);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
}

.cabinet-variants-page__type-select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.cabinet-variants-page__type-select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
