<template>
  <div class="catalog-page">
    <div class="catalog-page__toolbar">
      <NuxtLink to="/catalog" class="catalog-page__back">
        <Icon name="lucide:arrow-left" class="catalog-page__back-icon" />
        All series
      </NuxtLink>
    </div>

    <BasePanel :pending="pending" :error="!!error" :pagination="null" :empty-first-page="false" :empty-off-page="false" :item-count="0" :page="1">
      <template #loading>Loading catalog&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Could not load this series. It may have been deleted.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
        <NuxtLink to="/catalog" class="catalog-page__back-inline"> Back to catalog </NuxtLink>
      </template>

      <template #default>
        <div class="catalog-page__panel-body">
          <CatalogSeriesHeader
            v-if="series"
            :series="series"
            :taxonomy-line="seriesTaxonomyLine"
            @edit="openEditSeries"
            @add-type="openAddType"
          />

          <div class="catalog-page__list">
            <p v-if="types.length === 0 && !pending" class="catalog-page__empty-types">
              No cabinet types in this series yet. Add a type to start building variants and prices.
            </p>

            <p v-else-if="priceClasses.length === 0 && !pending" class="catalog-page__hint">
              No price classes are defined yet. Add them under
              <NuxtLink to="/price-classes" class="catalog-page__hint-link">Price classes</NuxtLink>
              to see price columns here.
            </p>

            <CatalogTypeBlock
              v-for="ct in types"
              :key="ct.documentId"
              :cabinet-type="ct"
              :price-classes="priceClasses"
              :locks-variant-height="catalogSeriesLocksVariantHeight"
              :prices-by-variant-id="pricesByVariantId"
              @refresh="refresh"
              @open-edit-type="openEditType"
              @open-add-variant="openAddVariant"
              @open-edit-variant="openEditVariant"
              @open-add-price="openAddPrice"
              @open-edit-price="openEditPrice"
              @open-link-depth-options="openLinkDepthOptions"
              @open-edit-depth-option="openEditDepthOption"
              @open-link-surcharge="openLinkSurcharge"
              @open-edit-surcharge-link="openEditSurchargeLink"
            />
          </div>
        </div>
      </template>
    </BasePanel>

    <ModalCabinetSeries ref="seriesModalRef" @saved="() => refresh()" />
    <ModalCabinetType ref="typeModalRef" @saved="() => refresh()" />
    <ModalCabinetVariant ref="variantModalRef" @saved="() => refresh()" />
    <ModalCabinetPrice ref="priceModalRef" @saved="() => refresh()" />
    <ModalDepthOption ref="depthOptionModalRef" @saved="() => refresh()" />
    <ModalDepthOptionLink ref="depthOptionLinkRef" @linked="() => refresh()" />
    <ModalSurchargeLink ref="surchargeLinkRef" @saved="() => refresh()" />
  </div>
</template>

<script setup lang="ts">
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import { getCabinetSeriesById, type CabinetSeries } from '../../services/cabinet-series';
import { getCabinetTypesCatalogForSeries, type CabinetType } from '../../services/cabinet-types';
import { fetchCabinetPricesForVariantIds } from '../../services/cabinet-prices';
import { getPriceClassesSortedByLevel, type PriceClass } from '../../services/price-classes';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';
import type { DepthOption } from '../../models/depth-option';
import type { CabinetTypeSurchargeLink } from '../../models/cabinet-type-surcharge-link';
import { seriesLocksVariantHeight } from '../../utils/seriesVariantHeight';

type CatalogPayload = {
  series: CabinetSeries;
  types: CabinetType[];
  priceClasses: PriceClass[];
  pricesByVariantId: Record<number, CabinetPrice[]>;
};

const route = useRoute();

const seriesDocumentId = computed(() => {
  const p = route.params.seriesDocumentId;
  return String(Array.isArray(p) ? (p[0] ?? '') : (p ?? ''));
});

const {
  data: catalogData,
  pending,
  error,
  refresh,
} = useAsyncData<CatalogPayload | null>(
  () => `catalog-series-detail-${seriesDocumentId.value}`,
  async () => {
    const docId = seriesDocumentId.value;
    if (!docId) return null;
    const seriesRes = await getCabinetSeriesById(docId);
    const sid = seriesRes.data.id;
    const [typesRes, pcRes] = await Promise.all([getCabinetTypesCatalogForSeries(sid), getPriceClassesSortedByLevel(100)]);
    const variantIds: number[] = [];
    for (const t of typesRes.data) {
      for (const v of strapiRelationList<CabinetVariant>(t.variants)) {
        variantIds.push(v.id);
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
    return { series: seriesRes.data, types: typesRes.data, priceClasses: pcRes.data, pricesByVariantId };
  },
  { watch: [seriesDocumentId] },
);

const series = computed(() => catalogData.value?.series ?? null);
const types = computed(() => catalogData.value?.types ?? []);
const priceClasses = computed(() => catalogData.value?.priceClasses ?? []);
const pricesByVariantId = computed(() => catalogData.value?.pricesByVariantId ?? {});

const catalogSeriesLocksVariantHeight = computed(() =>
  series.value != null && seriesLocksVariantHeight(series.value.carcaseHeight),
);

function seriesRelationName(rel: CabinetSeries['category']): string {
  if (!rel) return '';
  if (typeof rel === 'object' && rel !== null && 'name' in rel) return (rel as { name: string }).name;
  if (typeof rel === 'object' && rel !== null && 'data' in rel && (rel as { data: { name: string } | null }).data) {
    return (rel as { data: { name: string } }).data.name;
  }
  return '';
}

const seriesTaxonomyLine = computed(() => {
  const s = series.value;
  if (!s) return '';
  const cn = seriesRelationName(s.category);
  if (cn) return `Category: ${cn}`;
  const sn = seriesRelationName(s.subcategory);
  if (sn) return `Subcategory: ${sn}`;
  return '';
});

// ── Modal refs ────────────────────────────────────────────────────────────────

const seriesModalRef = ref<{ openEdit: (row: CabinetSeries) => void } | null>(null);
const typeModalRef = ref<{
  openCreateForSeries: (seriesNumericId: number) => void;
  openEdit: (row: CabinetType) => void;
} | null>(null);
const variantModalRef = ref<{
  openCreateForType: (typeNumericId: number, options?: { lockVariantHeight?: boolean }) => void;
  openEdit: (row: CabinetVariant, options?: { lockVariantHeight?: boolean }) => void;
} | null>(null);
const priceModalRef = ref<{
  openCreateForVariantAndPriceClass: (v: CabinetVariant, pc: PriceClass) => void;
  openEdit: (row: CabinetPrice) => void;
} | null>(null);
const depthOptionModalRef = ref<{ openEdit: (row: DepthOption) => void } | null>(null);
const depthOptionLinkRef = ref<{
  openPicker: (cabinetTypeDocumentId: string, linkedDocumentIds: string[], label?: string) => void;
} | null>(null);
const surchargeLinkRef = ref<{
  openCreate: (args: { cabinetTypeId: number; cabinetTypeLabel?: string; alreadyLinkedSurchargeDocumentIds: string[]; priceClasses: PriceClass[] }) => void;
  openEdit: (args: { link: CabinetTypeSurchargeLink; cabinetTypeLabel?: string; priceClasses: PriceClass[] }) => void;
} | null>(null);

// ── Modal openers ─────────────────────────────────────────────────────────────

function openEditSeries() {
  const s = series.value;
  if (s) seriesModalRef.value?.openEdit(s);
}

function openAddType() {
  const s = series.value;
  if (s) typeModalRef.value?.openCreateForSeries(s.id);
}

function openEditType(ct: CabinetType) {
  typeModalRef.value?.openEdit(ct);
}

function openAddVariant(typeNumericId: number) {
  variantModalRef.value?.openCreateForType(typeNumericId, {
    lockVariantHeight: catalogSeriesLocksVariantHeight.value,
  });
}

function openEditVariant(v: CabinetVariant) {
  variantModalRef.value?.openEdit(v, {
    lockVariantHeight: catalogSeriesLocksVariantHeight.value,
  });
}

function openAddPrice(v: CabinetVariant, pc: PriceClass) {
  priceModalRef.value?.openCreateForVariantAndPriceClass(v, pc);
}

function openEditPrice(p: CabinetPrice) {
  priceModalRef.value?.openEdit(p);
}

function openLinkDepthOptions(ctDocId: string, linkedDocIds: string[], label: string) {
  depthOptionLinkRef.value?.openPicker(ctDocId, linkedDocIds, label);
}

function openEditDepthOption(opt: DepthOption) {
  depthOptionModalRef.value?.openEdit(opt);
}

function openLinkSurcharge(args: { cabinetTypeId: number; cabinetTypeLabel: string; alreadyLinkedSurchargeDocumentIds: string[]; priceClasses: PriceClass[] }) {
  surchargeLinkRef.value?.openCreate(args);
}

function openEditSurchargeLink(args: { link: CabinetTypeSurchargeLink; cabinetTypeLabel: string; priceClasses: PriceClass[] }) {
  surchargeLinkRef.value?.openEdit(args);
}

useHead({
  title: computed(() => (series.value ? `${series.value.name} · Catalog` : 'Catalog')),
});
</script>

<style scoped>
.catalog-page__panel-body {
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.catalog-page__toolbar {
  margin-bottom: 1rem;
}

.catalog-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  text-decoration: none;
}

.catalog-page__back:hover {
  color: var(--color-brand);
}

.catalog-page__back-icon {
  width: 1rem;
  height: 1rem;
}

.catalog-page__back-inline {
  display: inline-block;
  margin-left: 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-brand);
}

.catalog-page__list {
  flex: 1;
  min-height: 0;
  padding: 1rem 1.25rem 1.5rem;
  background: color-mix(in srgb, var(--color-info-muted) 55%, var(--color-surface));
  box-sizing: border-box;
}

.catalog-page__empty-types {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-medium);
}

.catalog-page__hint {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
}

.catalog-page__hint-link {
  color: var(--color-brand);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}

.catalog-page__hint-link:hover {
  text-decoration: underline;
}
</style>
