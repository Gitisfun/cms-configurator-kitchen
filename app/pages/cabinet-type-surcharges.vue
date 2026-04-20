<template>
  <div>
    <CmsPageHeader title="Cabinet type surcharges" description="Surcharges (name, code, optional dimension, optional value size).">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add surcharge
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel
      :pending="pending"
      :error="!!error"
      :pagination="pagination"
      :empty-first-page="rows.length === 0 && page === 1"
      :empty-off-page="rows.length === 0 && page > 1"
      :item-count="rows.length"
      :page="page"
    >
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'surcharge' : 'surcharges' }}
      </template>
      <template #loading>Loading surcharges&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load surcharges.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:percent" />
        </div>
        <h3 class="base-panel__empty-title">No surcharges yet</h3>
        <p class="base-panel__empty-desc">Add surcharges for socket options, depth extras, and other fixed fees.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create surcharge
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No surcharges on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Dimension</th>
            <th scope="col">Value size</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:percent" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td>{{ row.code }}</td>
          <td>{{ formatDimension(row.dimension) }}</td>
          <td>{{ formatPrice(row.value ?? null) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Surcharge pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetTypeSurcharge ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  cabinetTypeSurchargesListPath,
  cabinetTypeSurchargesListQuery,
  defaultCabinetTypeSurchargesResponse,
  deleteCabinetTypeSurcharge,
  type CabinetTypeSurcharge,
  type CabinetTypeSurchargesResponse,
} from '../services/cabinet-type-surcharges';
import type { CabinetTypeSurchargeDimension } from '../models/cabinet-type-surcharge';

const DIMENSION_LABEL: Record<CabinetTypeSurchargeDimension, string> = {
  height: 'Height',
  width: 'Width',
  depth: 'Depth',
};

function formatDimension(d: CabinetTypeSurchargeDimension | null | undefined): string {
  if (d == null) return '—';
  return DIMENSION_LABEL[d] ?? String(d);
}

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<CabinetTypeSurchargesResponse>(cabinetTypeSurchargesListPath, {
  key: computed(() => `cabinet-type-surcharges-p${page.value}`),
  query: computed(() => cabinetTypeSurchargesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetTypeSurchargesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetTypeSurcharge>();
const deletingDocumentId = ref<string | null>(null);

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetTypeSurcharge) {
  if (!window.confirm(`Delete surcharge "${row.name}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetTypeSurcharge(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete surcharge.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
