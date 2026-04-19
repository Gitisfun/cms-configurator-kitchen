<template>
  <div>
    <CmsPageHeader
      title="Products"
      description="Cabinet catalog by series. Open a series to manage types, width variants, and price groups in one place."
    >
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add series
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
        {{ pagination!.total === 1 ? 'series' : 'series' }}
      </template>
      <template #loading>Loading series&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load cabinet series.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:package" />
        </div>
        <h3 class="base-panel__empty-title">No series yet</h3>
        <p class="base-panel__empty-desc">Create a cabinet series, then open its catalog to add types, variants, and prices.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add series
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No series on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Carcase height</th>
            <th scope="col">Default depth</th>
            <th scope="col">Product line</th>
            <th scope="col">Subcategory</th>
            <th scope="col" class="products-page__th-catalog">Catalog</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:box" />
              </span>
              <NuxtLink :to="`/products/${row.documentId}`" class="products-page__name-link">
                {{ row.name }}
              </NuxtLink>
            </div>
          </td>
          <td>{{ row.code }}</td>
          <td>{{ row.carcaseHeight != null ? `${row.carcaseHeight} mm` : '—' }}</td>
          <td>{{ row.defaultCarcaseDepth != null ? `${row.defaultCarcaseDepth} mm` : '—' }}</td>
          <td>{{ productLineLabel(row.productLine) }}</td>
          <td>{{ subcategoryLabel(row) }}</td>
          <td>
            <NuxtLink :to="`/products/${row.documentId}`" class="products-page__catalog-link">
              <Icon name="lucide:layout-grid" class="products-page__catalog-icon" />
              Open catalog
            </NuxtLink>
          </td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Product series pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetSeries ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate } from '../../utils/format';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import {
  cabinetSeriesListPath,
  cabinetSeriesListQuery,
  defaultCabinetSeriesResponse,
  deleteCabinetSeries,
  type CabinetSeries,
  type CabinetSeriesListResponse,
} from '../../services/cabinet-series';

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<CabinetSeriesListResponse>(cabinetSeriesListPath, {
  key: computed(() => `products-series-p${page.value}`),
  query: computed(() => cabinetSeriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetSeriesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetSeries>();
const deletingDocumentId = ref<string | null>(null);

function productLineLabel(pl: string | null): string {
  if (!pl) return '—';
  const map: Record<string, string> = { standard: 'Standard', cLine: 'C-Line', xLine: 'X-Line' };
  return map[pl] ?? pl;
}

function subcategoryLabel(row: CabinetSeries): string {
  const sc = row.subcategory;
  if (!sc) return '—';
  if (typeof sc === 'object' && sc !== null && 'name' in sc) return (sc as { name: string }).name;
  if (typeof sc === 'object' && sc !== null && 'data' in sc && (sc as { data: { name: string } | null }).data) {
    return (sc as { data: { name: string } }).data.name;
  }
  return '—';
}

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetSeries) {
  if (!window.confirm(`Delete series "${row.name}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetSeries(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete cabinet series.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>

<style scoped>
.products-page__name-link {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.products-page__name-link:hover {
  text-decoration: underline;
}

.products-page__catalog-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
}

.products-page__catalog-link:hover {
  text-decoration: underline;
}

.products-page__catalog-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.products-page__th-catalog {
  white-space: nowrap;
}
</style>
