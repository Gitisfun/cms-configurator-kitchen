<template>
  <div>
    <CmsPageHeader
      title="Catalog"
      description="Cabinet catalog by series. Open a series to manage types, width variants, and price groups in one place."
    >
      <template #actions>
        <div class="catalog-index__header-actions">
          <BaseButton
            type="button"
            variant="outlined"
            :title="catalogListView === 'table' ? 'Show catalog layout by series' : 'Show series table'"
            @click="toggleCatalogListView"
          >
            <Icon :name="catalogListView === 'table' ? 'lucide:layout-grid' : 'lucide:table'" class="base-btn__icon" />
            {{ catalogListView === 'table' ? 'Catalog view' : 'Table view' }}
          </BaseButton>
          <BaseButton type="button" @click="openCreateModal">
            <Icon name="lucide:plus" class="base-btn__icon" />
            Add series
          </BaseButton>
        </div>
      </template>
    </CmsPageHeader>

    <BasePanel
      :pending="panelPending"
      :error="panelError"
      :pagination="pagination"
      :empty-first-page="rows.length === 0 && page === 1"
      :empty-off-page="rows.length === 0 && page > 1"
      :item-count="rows.length"
      :page="page"
    >
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'series' : 'series' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>
        <template v-if="catalogListView === 'catalog'">Loading catalog overview&hellip;</template>
        <template v-else>Loading series&hellip;</template>
      </template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span v-if="error">Failed to load cabinet series.</span>
        <span v-else>Could not load catalog overview for this page.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="retryCatalogPanel"> Retry </BaseButton>
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

      <div v-if="catalogListView === 'catalog'" class="catalog-index__catalog-view">
        <CatalogOverviewSection
          v-for="sec in overviewSections"
          :key="sec.series.documentId"
          :series="sec.series"
          :types="sec.types"
          :price-classes="overviewPriceClasses"
          :prices-by-variant-id="overviewPricesByVariantId"
          :locks-variant-height="seriesLocksVariantHeight(sec.series.carcaseHeight)"
        />
      </div>

      <BaseTable v-else>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(rows.map((r) => r.documentId))"
                :indeterminate="someOnPageSelected(rows.map((r) => r.documentId)) && !allOnPageSelected(rows.map((r) => r.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(rows.map((r) => r.documentId))"
              />
            </th>
            <th scope="col" class="catalog-index__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Carcase height</th>
            <th scope="col">Default depth</th>
            <th scope="col">Product line</th>
            <th scope="col">Category / subcategory</th>
            <th scope="col" class="catalog-index__th-open">Open</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId" :class="{ 'base-table__row--selected': isSelected(row.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(row.documentId)" :aria-label="`Select ${row.name}`" @change="toggle(row.documentId)" />
          </td>
          <td class="catalog-index__td-image">
            <img v-if="seriesImageSrc(row)" :src="seriesImageSrc(row)" alt="" class="catalog-index__series-thumb" loading="lazy" width="40" height="40" />
            <span v-else class="catalog-index__series-thumb-placeholder" aria-hidden="true">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:box" />
              </span>
              <NuxtLink :to="`/catalog/${row.documentId}`" class="catalog-index__name-link">
                {{ row.name }}
              </NuxtLink>
            </div>
          </td>
          <td>{{ row.carcaseHeight != null ? `${row.carcaseHeight} mm` : '—' }}</td>
          <td>{{ row.defaultCarcaseDepth != null ? `${row.defaultCarcaseDepth} mm` : '—' }}</td>
          <td>{{ productLineLabel(row.productLine) }}</td>
          <td>{{ seriesTaxonomyLabel(row) }}</td>
          <td>
            <NuxtLink :to="`/catalog/${row.documentId}`" class="catalog-index__open-link">
              <Icon name="lucide:layout-grid" class="catalog-index__open-icon" />
              Open catalog
            </NuxtLink>
          </td>
          <td>{{ Format.dateTime(row.updatedAt) }}</td>
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
        <BasePagination
          v-model:page="page"
          :page-count="pagination!.pageCount"
          :disabled="panelPending"
          aria-label="Catalog series pages"
          variant="panel"
        />
      </template>
    </BasePanel>

    <ModalCabinetSeries ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../../utils/format';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import { seriesLocksVariantHeight } from '../../utils/seriesVariantHeight';
import {
  cabinetSeriesListPath,
  cabinetSeriesListQuery,
  defaultCabinetSeriesResponse,
  deleteCabinetSeries,
  type CabinetSeries,
  type CabinetSeriesListResponse,
} from '../../services/cabinet-series';
import { getCabinetTypesCatalogForSeries, type CabinetType } from '../../services/cabinet-types';
import { fetchCabinetPricesForVariantIds } from '../../services/cabinet-prices';
import { getPriceClassesSortedByLevel, type PriceClass } from '../../services/price-classes';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';

const strapiPublicUrl = useStrapiPublicUrl();

const PAGE_SIZE = 25;
const page = ref(1);
const catalogListView = ref<'table' | 'catalog'>('table');

const { data, pending, error, refresh } = useFetch<CabinetSeriesListResponse>(cabinetSeriesListPath, {
  key: computed(() => `catalog-series-p${page.value}`),
  query: computed(() => cabinetSeriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetSeriesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const rowsSignature = computed(() => rows.value.map((r) => r.documentId).join('|'));

type CatalogListOverviewPayload = {
  priceClasses: PriceClass[];
  sections: { series: CabinetSeries; types: CabinetType[] }[];
  pricesByVariantId: Record<number, CabinetPrice[]>;
};

const overviewAsyncKey = computed(
  () => `catalog-list-overview-${catalogListView.value}-${page.value}-${rowsSignature.value}`,
);

const {
  data: catalogOverview,
  pending: overviewPending,
  error: overviewError,
  refresh: refreshCatalogOverview,
} = useAsyncData<CatalogListOverviewPayload | null>(
  overviewAsyncKey,
  async () => {
    if (catalogListView.value !== 'catalog') return null;
    const seriesList = data.value?.data ?? [];
    if (seriesList.length === 0) {
      return { priceClasses: [], sections: [], pricesByVariantId: {} };
    }
    const [pcRes, typesPerSeries] = await Promise.all([
      getPriceClassesSortedByLevel(100),
      Promise.all(seriesList.map((s) => getCabinetTypesCatalogForSeries(s.id))),
    ]);
    const priceClasses = pcRes.data;
    const sections = seriesList.map((s, i) => ({
      series: s,
      types: typesPerSeries[i]?.data ?? [],
    }));
    const variantIds: number[] = [];
    for (const sec of sections) {
      for (const t of sec.types) {
        for (const v of strapiRelationList<CabinetVariant>(t.variants)) {
          variantIds.push(v.id);
        }
      }
    }
    const priceRows = await fetchCabinetPricesForVariantIds(variantIds);
    const pricesByVariantId: Record<number, CabinetPrice[]> = {};
    for (const p of priceRows) {
      const vid = extractRelationNumericId(p.cabinetVariant);
      if (vid == null) continue;
      if (!pricesByVariantId[vid]) pricesByVariantId[vid] = [];
      pricesByVariantId[vid].push(p);
    }
    return { priceClasses, sections, pricesByVariantId };
  },
  { watch: [catalogListView, page, rowsSignature] },
);

const overviewSections = computed(() => catalogOverview.value?.sections ?? []);
const overviewPriceClasses = computed(() => catalogOverview.value?.priceClasses ?? []);
const overviewPricesByVariantId = computed(() => catalogOverview.value?.pricesByVariantId ?? {});

const panelPending = computed(() => pending.value || (catalogListView.value === 'catalog' && overviewPending.value));

const panelError = computed(() => Boolean(error.value) || (catalogListView.value === 'catalog' && Boolean(overviewError.value)));

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetSeries>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);
const { selectedIds, hasSelection, selectionCount, isSelected, toggle, togglePage, allOnPageSelected, someOnPageSelected, clearSelection } = useTableSelection();
const bulkDeleting = ref(false);

watch(page, () => clearSelection());

watch(catalogListView, (v) => {
  if (v === 'catalog') clearSelection();
});

function toggleCatalogListView() {
  catalogListView.value = catalogListView.value === 'table' ? 'catalog' : 'table';
}

async function retryCatalogPanel() {
  await refresh();
  if (catalogListView.value === 'catalog') await refreshCatalogOverview();
}

function productLineLabel(pl: string | null): string {
  if (!pl) return '—';
  const map: Record<string, string> = { standard: 'Standard', cLine: 'C-Line', xLine: 'X-Line' };
  return map[pl] ?? pl;
}

function relationName(rel: CabinetSeries['category'] | CabinetSeries['subcategory']): string {
  if (!rel) return '';
  if (typeof rel === 'object' && rel !== null && 'name' in rel) return (rel as { name: string }).name;
  if (typeof rel === 'object' && rel !== null && 'data' in rel && (rel as { data: { name: string } | null }).data) {
    return (rel as { data: { name: string } }).data.name;
  }
  return '';
}

function seriesTaxonomyLabel(row: CabinetSeries): string {
  const cat = relationName(row.category);
  if (cat) return cat;
  const sub = relationName(row.subcategory);
  if (sub) return sub;
  return '—';
}

function seriesImageSrc(row: CabinetSeries): string | null {
  return extractPlinthImage(row, strapiPublicUrl.value).src;
}

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
  if (catalogListView.value === 'catalog') await refreshCatalogOverview();
}

async function confirmDelete(row: CabinetSeries) {
  const ok = await requestConfirm({
    title: 'Delete series?',
    message: `Delete "${row.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetSeries(row.documentId);
    await refresh();
    toast.success('Cabinet series deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete cabinet series.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'series' : 'series';
  const ok = await requestConfirm({
    title: `Delete ${ids.length} ${noun}?`,
    message: `Permanently delete ${ids.length} selected cabinet ${noun}? This cannot be undone.`,
    confirmLabel: `Delete ${ids.length}`,
    danger: true,
  });
  if (!ok) return;
  bulkDeleting.value = true;
  let deleted = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await deleteCabinetSeries(id);
      deleted++;
    } catch {
      failed++;
    }
  }
  bulkDeleting.value = false;
  clearSelection();
  await refresh();
  if (failed === 0) toast.success(`Deleted ${deleted} cabinet ${noun}.`);
  else toast.danger(`Deleted ${deleted} of ${ids.length} ${noun}. ${failed} failed.`);
}
</script>

<style scoped>
.catalog-index__name-link {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.catalog-index__name-link:hover {
  text-decoration: underline;
}

.catalog-index__open-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
}

.catalog-index__open-link:hover {
  text-decoration: underline;
}

.catalog-index__open-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.catalog-index__th-open {
  white-space: nowrap;
}

.catalog-index__th-image {
  width: 3.25rem;
}

.catalog-index__td-image {
  vertical-align: middle;
}

.catalog-index__series-thumb {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}

.catalog-index__series-thumb-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--button-radius);
  border: 1px dashed var(--color-border);
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.catalog-index__header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.catalog-index__catalog-view {
  padding: 1rem 1.25rem 1.5rem;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--color-info-muted) 55%, var(--color-surface));
}
</style>
