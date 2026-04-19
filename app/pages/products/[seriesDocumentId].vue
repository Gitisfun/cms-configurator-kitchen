<template>
  <div class="catalog-page">
    <div class="catalog-page__toolbar">
      <NuxtLink to="/products" class="catalog-page__back">
        <Icon name="lucide:arrow-left" class="catalog-page__back-icon" />
        All products
      </NuxtLink>
    </div>

    <BasePanel
      :pending="pending"
      :error="!!error"
      :pagination="null"
      :empty-first-page="false"
      :empty-off-page="false"
      :item-count="0"
      :page="1"
    >
      <template #loading>Loading catalog&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Could not load this series. It may have been deleted.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
        <NuxtLink to="/products" class="catalog-page__back-inline"> Back to products </NuxtLink>
      </template>

      <template #default>
        <div class="catalog-page__panel-body">
        <div v-if="series" class="catalog-page__header">
          <div class="catalog-page__header-main">
            <h1 class="catalog-page__title">{{ series.name }}</h1>
            <p class="catalog-page__meta">
              <span>Code <strong>{{ series.code }}</strong></span>
              <span class="catalog-page__meta-sep">·</span>
              <span>Carcase height <strong>{{ series.carcaseHeight != null ? `${series.carcaseHeight} mm` : '—' }}</strong></span>
              <span class="catalog-page__meta-sep">·</span>
              <span>Default depth <strong>{{ series.defaultCarcaseDepth != null ? `${series.defaultCarcaseDepth} mm` : '—' }}</strong></span>
              <template v-if="series.productLine">
                <span class="catalog-page__meta-sep">·</span>
                <span>{{ productLineLabel(series.productLine) }}</span>
              </template>
            </p>
            <p v-if="subcategoryLabel" class="catalog-page__category">Subcategory: {{ subcategoryLabel }}</p>
          </div>
          <div class="catalog-page__header-actions">
            <BaseButton type="button" variant="outlined" @click="openEditSeries">
              <Icon name="lucide:pencil" class="base-btn__icon" />
              Edit series
            </BaseButton>
            <BaseButton type="button" variant="primary" @click="openAddType">
              <Icon name="lucide:plus" class="base-btn__icon" />
              Add cabinet type
            </BaseButton>
          </div>
        </div>

        <p v-if="types.length === 0 && !pending" class="catalog-page__empty-types">
          No cabinet types in this series yet. Add a type to start building variants and prices.
        </p>

        <p v-else-if="priceClasses.length === 0 && !pending" class="catalog-page__hint">
          No price classes are defined yet. Add them under
          <NuxtLink to="/price-classes" class="catalog-page__hint-link">Price classes</NuxtLink>
          to see price columns here.
        </p>

        <div v-for="cabinetType in types" :key="cabinetType.documentId" class="catalog-type-block">
          <div class="catalog-type-block__summary">
            <div class="catalog-type-block__thumb">
              <img v-if="typeImageSrc(cabinetType)" :src="typeImageSrc(cabinetType)!" alt="" class="catalog-type-block__thumb-img" loading="lazy" />
              <div v-else class="catalog-type-block__thumb-placeholder">
                <Icon name="lucide:image" />
              </div>
            </div>
            <div class="catalog-type-block__info">
              <h2 class="catalog-type-block__name">{{ cabinetType.name }}</h2>
              <p v-if="cabinetType.description" class="catalog-type-block__desc">{{ cabinetType.description }}</p>
              <p class="catalog-type-block__chips">
                <span v-if="cabinetType.orderNumberPrefix" class="catalog-type-block__chip">Prefix {{ cabinetType.orderNumberPrefix }}</span>
                <span class="catalog-type-block__chip">L/R {{ cabinetType.hasLeftRight ? 'Yes' : 'No' }}</span>
                <span v-if="subcategoryName(cabinetType)" class="catalog-type-block__chip">{{ subcategoryName(cabinetType) }}</span>
              </p>
            </div>
            <div class="catalog-type-block__actions">
              <BaseButton type="button" variant="text" size="sm" @click="toggleExpanded(cabinetType.documentId)">
                <Icon :name="isExpanded(cabinetType.documentId) ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="base-btn__icon" />
                {{ isExpanded(cabinetType.documentId) ? 'Hide' : 'Variants & prices' }}
              </BaseButton>
              <BaseButton type="button" variant="text" size="sm" @click="openEditType(cabinetType)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit type
              </BaseButton>
              <BaseButton type="button" variant="text" size="sm" @click="openAddVariant(cabinetType.id)">
                <Icon name="lucide:plus" class="base-btn__icon" />
                Add variant
              </BaseButton>
            </div>
          </div>

          <div v-show="isExpanded(cabinetType.documentId)" class="catalog-type-block__detail">
            <div v-if="priceClasses.length === 0" class="catalog-matrix__no-classes">
              Add
              <NuxtLink to="/price-classes" class="catalog-matrix__inline-link-nav">price classes</NuxtLink>
              to see the price grid (groups 0, 1, 2&hellip;) for each variant.
            </div>
            <div v-else class="catalog-matrix-wrap">
              <table
                class="catalog-matrix"
                :class="
                  catalogSeriesLocksVariantHeight
                    ? 'catalog-matrix--variant-height-hidden'
                    : 'catalog-matrix--variant-height-visible'
                "
              >
                <thead>
                  <tr>
                    <th
                      v-if="!catalogSeriesLocksVariantHeight"
                      rowspan="2"
                      scope="col"
                      class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--height catalog-matrix__sticky-stack-h"
                    >
                      Height <span class="catalog-matrix__th-sub">(mm)</span>
                    </th>
                    <th
                      rowspan="2"
                      scope="col"
                      class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--width"
                      :class="catalogSeriesLocksVariantHeight ? 'catalog-matrix__sticky-stack-w-only' : 'catalog-matrix__sticky-stack-w'"
                    >
                      Width <span class="catalog-matrix__th-sub">(mm)</span>
                    </th>
                    <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--order catalog-matrix__sticky-stack-o">
                      Order no.
                    </th>
                    <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--lr catalog-matrix__sticky-stack-lr">
                      L/R
                    </th>
                    <th
                      :colspan="priceClasses.length"
                      scope="colgroup"
                      class="catalog-matrix__th catalog-matrix__th--price-groups-banner"
                    >
                      Price groups
                    </th>
                    <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--actions" aria-label="Row actions" />
                  </tr>
                  <tr>
                    <th
                      v-for="(pc, pcIdx) in priceClasses"
                      :key="pc.documentId"
                      scope="col"
                      class="catalog-matrix__th catalog-matrix__th--price-index"
                      :class="{ 'catalog-matrix__col--stripe': isPriceStripeColumn(pcIdx) }"
                      :title="priceClassTooltip(pc)"
                    >
                      <span class="catalog-matrix__price-index-num">{{ pc.level }}</span>
                      <span class="catalog-matrix__price-index-name">{{ pc.name }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="variant in variantsOf(cabinetType)" :key="variant.documentId" class="catalog-matrix__row">
                    <td
                      v-if="!catalogSeriesLocksVariantHeight"
                      class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--height catalog-matrix__sticky-stack-h"
                    >
                      <template v-if="variant.height != null">{{ variant.height }}</template>
                      <span v-else class="catalog-matrix__height-placeholder">—</span>
                    </td>
                    <td
                      class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--width"
                      :class="catalogSeriesLocksVariantHeight ? 'catalog-matrix__sticky-stack-w-only' : 'catalog-matrix__sticky-stack-w'"
                    >
                      {{ variantWidthCell(variant) }}
                    </td>
                    <td class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--order catalog-matrix__td-mono catalog-matrix__sticky-stack-o">
                      {{ variant.orderNumber }}
                    </td>
                    <td class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--lr catalog-matrix__sticky-stack-lr">
                      {{ lrCellLabel(cabinetType) }}
                    </td>
                    <td
                      v-for="(pc, pcIdx) in priceClasses"
                      :key="`${variant.documentId}-${pc.documentId}`"
                      class="catalog-matrix__td catalog-matrix__td--price"
                      :class="{ 'catalog-matrix__col--stripe': isPriceStripeColumn(pcIdx) }"
                    >
                      <template v-if="priceCell(variant, pc)">
                        <button type="button" class="catalog-matrix__price-btn" @click="openEditPrice(priceCell(variant, pc)!)">
                          {{ formatPriceValue(priceCell(variant, pc)!.price) }}
                        </button>
                      </template>
                      <button
                        v-else
                        type="button"
                        class="catalog-matrix__price-add"
                        :title="`Add price for ${variant.orderNumber} — group ${pc.level} (${pc.name})`"
                        @click="openAddPrice(variant, pc)"
                      >
                        —
                      </button>
                    </td>
                    <td class="catalog-matrix__td catalog-matrix__td--actions">
                      <BaseButton type="button" variant="text" size="sm" @click="openEditVariant(variant)">
                        Edit
                      </BaseButton>
                    </td>
                  </tr>
                  <tr v-if="variantsOf(cabinetType).length === 0">
                    <td
                      :colspan="(catalogSeriesLocksVariantHeight ? 3 : 4) + priceClasses.length + 1"
                      class="catalog-matrix__empty-row"
                    >
                      No variants yet.
                      <button type="button" class="catalog-matrix__inline-link" @click="openAddVariant(cabinetType.id)">Add variant</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="catalog-depth-section">
              <div class="catalog-depth-section__head">
                <h3 class="catalog-depth-section__title">Depth options</h3>
                <BaseButton type="button" variant="text" size="sm" @click="openLinkDepthOptions(cabinetType)">
                  <Icon name="lucide:plus" class="base-btn__icon" />
                  Link depth option
                </BaseButton>
              </div>
              <div v-if="depthOptionsListed(cabinetType).length > 0" class="catalog-matrix-wrap">
                <table class="catalog-depth-matrix">
                  <thead>
                    <tr>
                      <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-name">Name</th>
                      <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-mm">
                        Depth <span class="catalog-matrix__th-sub">(mm)</span>
                      </th>
                      <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-edit">Edit</th>
                      <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-remove">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="opt in depthOptionsListed(cabinetType)" :key="opt.documentId" class="catalog-depth-matrix__row">
                      <td class="catalog-depth-matrix__td catalog-depth-matrix__td-name">{{ opt.name }}</td>
                      <td class="catalog-depth-matrix__td catalog-depth-matrix__td-mm">{{ opt.depth }}</td>
                      <td class="catalog-depth-matrix__td catalog-depth-matrix__td-edit">
                        <BaseButton type="button" variant="text" size="sm" @click="openEditDepthOption(opt)"> Edit </BaseButton>
                      </td>
                      <td class="catalog-depth-matrix__td catalog-depth-matrix__td-remove">
                        <BaseButton
                          type="button"
                          variant="text"
                          danger
                          size="sm"
                          :disabled="depthUnlinkingDocumentId !== null"
                          :loading="depthUnlinkingDocumentId === opt.documentId"
                          @click="confirmUnlinkDepthOption(cabinetType, opt)"
                        >
                          Remove
                        </BaseButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="catalog-depth-section__empty">No depth options linked yet. Use Link depth option to attach rows from the library.</p>
            </div>
          </div>
        </div>
        </div>
      </template>
    </BasePanel>

    <ModalCabinetSeries ref="seriesModalRef" @saved="onSeriesSaved" />
    <ModalCabinetType ref="typeModalRef" @saved="onTypeSaved" />
    <ModalCabinetVariant ref="variantModalRef" @saved="onVariantSaved" />
    <ModalCabinetPrice ref="priceModalRef" @saved="onPriceSaved" />
    <ModalDepthOption ref="depthOptionModalRef" @saved="onDepthOptionSaved" />
    <ModalDepthOptionLink ref="depthOptionLinkRef" @linked="onDepthOptionLinked" />
  </div>
</template>

<script setup lang="ts">
import { extractPlinthImage } from '../../utils/plinthImage';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationDocumentId, extractRelationNumericId } from '../../utils/strapiRelationMeta';
import {
  getCabinetSeriesById,
  type CabinetSeries,
} from '../../services/cabinet-series';
import { getCabinetTypesCatalogForSeries, type CabinetType } from '../../services/cabinet-types';
import { fetchCabinetPricesForVariantIds } from '../../services/cabinet-prices';
import { getPriceClassesSortedByLevel, type PriceClass } from '../../services/price-classes';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';
import type { DepthOption } from '../../models/depth-option';
import { updateDepthOption } from '../../services/depth-options';
import { seriesLocksVariantHeight } from '../../utils/seriesVariantHeight';

type CatalogPayload = {
  series: CabinetSeries;
  types: CabinetType[];
  priceClasses: PriceClass[];
  /** Merged from a dedicated prices query when nested populate omits rows (Strapi 5). */
  pricesByVariantId: Record<number, CabinetPrice[]>;
};

const route = useRoute();
const strapiPublicUrl = useStrapiPublicUrl();

const seriesDocumentId = computed(() => {
  const p = route.params.seriesDocumentId;
  return String(Array.isArray(p) ? p[0] ?? '' : p ?? '');
});

const { data: catalogData, pending, error, refresh } = useAsyncData<CatalogPayload | null>(
  () => `product-catalog-${seriesDocumentId.value}`,
  async () => {
    const docId = seriesDocumentId.value;
    if (!docId) return null;
    const seriesRes = await getCabinetSeriesById(docId);
    const sid = seriesRes.data.id;
    const [typesRes, pcRes] = await Promise.all([
      getCabinetTypesCatalogForSeries(sid),
      getPriceClassesSortedByLevel(100),
    ]);
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
    return {
      series: seriesRes.data,
      types: typesRes.data,
      priceClasses: pcRes.data,
      pricesByVariantId,
    };
  },
  { watch: [seriesDocumentId] },
);

const series = computed(() => catalogData.value?.series ?? null);
const types = computed(() => catalogData.value?.types ?? []);
const priceClasses = computed(() => catalogData.value?.priceClasses ?? []);

/** Fixed series carcase height → no per-variant height in the grid or modal. */
const catalogSeriesLocksVariantHeight = computed(
  () => series.value != null && seriesLocksVariantHeight(series.value.carcaseHeight),
);

const subcategoryLabel = computed(() => {
  const s = series.value;
  if (!s?.subcategory) return '';
  const sc = s.subcategory;
  if (typeof sc === 'object' && sc !== null && 'name' in sc) return (sc as { name: string }).name;
  if (typeof sc === 'object' && sc !== null && 'data' in sc && (sc as { data: { name: string } | null }).data) {
    return (sc as { data: { name: string } }).data.name;
  }
  return '';
});

const expandedTypeIds = ref<Record<string, boolean>>({});

function isExpanded(documentId: string): boolean {
  return !!expandedTypeIds.value[documentId];
}

function toggleExpanded(documentId: string) {
  expandedTypeIds.value = {
    ...expandedTypeIds.value,
    [documentId]: !expandedTypeIds.value[documentId],
  };
}

function productLineLabel(pl: string | null): string {
  if (!pl) return '';
  const map: Record<string, string> = { standard: 'Standard', cLine: 'C-Line', xLine: 'X-Line' };
  return map[pl] ?? pl;
}

function typeImageSrc(row: CabinetType): string | null {
  return extractPlinthImage(row, strapiPublicUrl.value).src;
}

function subcategoryName(row: CabinetType): string {
  const sc = row.subcategory;
  if (!sc) return '';
  if (typeof sc === 'object' && sc !== null && 'name' in sc) return (sc as { name: string }).name;
  if (typeof sc === 'object' && sc !== null && 'data' in sc && (sc as { data: { name: string } | null }).data) {
    return (sc as { data: { name: string } }).data.name;
  }
  return '';
}

function variantsOf(cabinetType: CabinetType): CabinetVariant[] {
  const list = strapiRelationList<CabinetVariant>(cabinetType.variants);
  return [...list].sort((a, b) => {
    if (a.width !== b.width) return a.width - b.width;
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return ah - bh;
    return a.orderNumber.localeCompare(b.orderNumber);
  });
}

function depthOptionsListed(cabinetType: CabinetType): DepthOption[] {
  const list = strapiRelationList<DepthOption>(cabinetType.depthOptions);
  return [...list].sort((a, b) => a.depth - b.depth);
}

/** Width only (variable range or fixed mm). */
function variantWidthCell(v: CabinetVariant): string {
  return v.isVariableWidth && v.minWidth != null && v.maxWidth != null
    ? `${v.minWidth}–${v.maxWidth}`
    : String(v.width);
}

function lrCellLabel(ct: CabinetType): string {
  return ct.hasLeftRight ? 'L/R' : '—';
}

function isPriceStripeColumn(index: number): boolean {
  return index % 2 === 1;
}

function priceClassTooltip(pc: PriceClass): string {
  return `${pc.name} (group ${pc.level})`;
}

function pricesOf(variant: CabinetVariant): CabinetPrice[] {
  const nested = strapiRelationList<CabinetPrice>(variant.prices);
  const extra = catalogData.value?.pricesByVariantId?.[variant.id] ?? [];
  const byDoc = new Map<string, CabinetPrice>();
  for (const p of nested) byDoc.set(p.documentId, p);
  for (const p of extra) byDoc.set(p.documentId, p);
  return [...byDoc.values()];
}

function priceClassMatches(rel: unknown, pc: PriceClass): boolean {
  const id = extractRelationNumericId(rel);
  if (id != null && id === pc.id) return true;
  const doc = extractRelationDocumentId(rel);
  return doc != null && doc === pc.documentId;
}

function priceCell(variant: CabinetVariant, pc: PriceClass): CabinetPrice | null {
  return pricesOf(variant).find((p) => priceClassMatches(p.priceClass, pc)) ?? null;
}

function formatPriceValue(p: number | string): string {
  const n = typeof p === 'number' ? p : Number(p);
  if (!Number.isFinite(n)) return String(p);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

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
const depthUnlinkingDocumentId = ref<string | null>(null);

function openEditSeries() {
  const s = series.value;
  if (s) seriesModalRef.value?.openEdit(s);
}

function openAddType() {
  const s = series.value;
  if (s) typeModalRef.value?.openCreateForSeries(s.id);
}

function openEditType(row: CabinetType) {
  typeModalRef.value?.openEdit(row);
}

function openAddVariant(typeNumericId: number) {
  variantModalRef.value?.openCreateForType(typeNumericId, {
    lockVariantHeight: catalogSeriesLocksVariantHeight.value,
  });
}

function openEditVariant(row: CabinetVariant) {
  variantModalRef.value?.openEdit(row, {
    lockVariantHeight: catalogSeriesLocksVariantHeight.value,
  });
}

function openAddPrice(variant: CabinetVariant, pc: PriceClass) {
  void priceModalRef.value?.openCreateForVariantAndPriceClass(variant, pc);
}

function openEditPrice(row: CabinetPrice) {
  priceModalRef.value?.openEdit(row);
}

function openEditDepthOption(opt: DepthOption) {
  depthOptionModalRef.value?.openEdit(opt);
}

function openLinkDepthOptions(cabinetType: CabinetType) {
  depthOptionLinkRef.value?.openPicker(
    cabinetType.documentId,
    depthOptionsListed(cabinetType).map((d) => d.documentId),
    cabinetType.name,
  );
}

async function confirmUnlinkDepthOption(cabinetType: CabinetType, opt: DepthOption) {
  if (!window.confirm(`Remove depth option "${opt.name}" from this cabinet type? The row stays in the library.`)) return;
  depthUnlinkingDocumentId.value = opt.documentId;
  try {
    await updateDepthOption(opt.documentId, {
      disconnectCabinetTypeDocumentIds: [cabinetType.documentId],
    });
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Could not remove depth option.'));
  } finally {
    depthUnlinkingDocumentId.value = null;
  }
}

async function onSeriesSaved() {
  await refresh();
}

async function onTypeSaved() {
  await refresh();
}

async function onVariantSaved() {
  await refresh();
}

async function onPriceSaved() {
  await refresh();
}

async function onDepthOptionSaved() {
  await refresh();
}

async function onDepthOptionLinked() {
  await refresh();
}

useHead({
  title: computed(() => (series.value ? `${series.value.name} · Catalog` : 'Catalog')),
});
</script>

<style scoped>
.catalog-page__panel-body {
  padding: 1.25rem 1.25rem 1.5rem;
  box-sizing: border-box;
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

.catalog-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.catalog-page__title {
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.catalog-page__meta {
  margin: 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.catalog-page__meta-sep {
  margin: 0 0.25rem;
  opacity: 0.5;
}

.catalog-page__category {
  margin: 0.5rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.catalog-page__header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

.catalog-type-block {
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
  margin-bottom: 1rem;
  overflow: hidden;
}

.catalog-type-block__summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
}

@media (max-width: 768px) {
  .catalog-type-block__summary {
    grid-template-columns: 1fr;
  }
}

.catalog-type-block__thumb {
  width: 88px;
  height: 88px;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow: hidden;
  flex-shrink: 0;
}

.catalog-type-block__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.catalog-type-block__thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.catalog-type-block__thumb-placeholder :deep(svg) {
  width: 28px;
  height: 28px;
  opacity: 0.5;
}

.catalog-type-block__name {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
}

.catalog-type-block__desc {
  margin: 0 0 0.5rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-secondary, #6b7280);
  white-space: pre-wrap;
}

.catalog-type-block__chips {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.catalog-type-block__chip {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.catalog-type-block__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.catalog-type-block__detail {
  border-top: 1px solid var(--color-border);
  padding: 0.75rem 1rem 1rem;
  background: var(--color-surface);
}

.catalog-matrix__no-classes {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.catalog-matrix__inline-link-nav {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.catalog-matrix__inline-link-nav:hover {
  text-decoration: underline;
}

.catalog-matrix-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
}

.catalog-matrix {
  --cat-col-w: 4.5rem;
  --cat-col-h: 4.5rem;
  --cat-col-o: 8.25rem;
  --cat-col-lr: 2.35rem;
  --cat-stripe: rgba(15, 23, 42, 0.06);
  --cat-header-band: rgba(34, 197, 94, 0.12);

  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.75rem;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: 'tnum' 1;
}

.catalog-matrix__th,
.catalog-matrix__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.35rem 0.45rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.catalog-matrix__th:last-child,
.catalog-matrix__td:last-child {
  border-right: none;
}

.catalog-matrix__row:last-child .catalog-matrix__td {
  border-bottom: none;
}

.catalog-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.catalog-matrix__th-sub {
  display: block;
  font-size: 0.65rem;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}

.catalog-matrix__th--width {
  text-align: right;
  width: var(--cat-col-w);
  min-width: var(--cat-col-w);
  max-width: var(--cat-col-w);
  line-height: 1.2;
}

.catalog-matrix__th--height {
  text-align: right;
  width: var(--cat-col-h);
  min-width: var(--cat-col-h);
  max-width: var(--cat-col-h);
  line-height: 1.2;
}

.catalog-matrix__th--order {
  text-align: left;
  width: var(--cat-col-o);
  min-width: var(--cat-col-o);
  max-width: 10.5rem;
}

.catalog-matrix__th--lr {
  text-align: center;
  width: var(--cat-col-lr);
  min-width: var(--cat-col-lr);
  max-width: var(--cat-col-lr);
  font-size: 0.7rem;
}

.catalog-matrix__th--price-groups-banner {
  text-align: center;
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
  background: var(--cat-header-band);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  padding: 0.45rem 0.5rem;
}

.catalog-matrix__th--price-index {
  text-align: center;
  width: 3.35rem;
  min-width: 3.35rem;
  max-width: 3.75rem;
  padding: 0.25rem 0.2rem 0.35rem;
  vertical-align: bottom;
  line-height: 1.15;
  background: var(--color-surface-card);
}

.catalog-matrix__price-index-num {
  display: block;
  font-size: 0.85rem;
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.catalog-matrix__price-index-name {
  display: block;
  font-size: 0.58rem;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 3.5rem;
  margin: 0 auto;
}

.catalog-matrix__th--actions {
  width: 3.75rem;
  min-width: 3.75rem;
  max-width: 3.75rem;
}

.catalog-matrix__td--width {
  text-align: right;
  white-space: nowrap;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  width: var(--cat-col-w);
  min-width: var(--cat-col-w);
}

.catalog-matrix__td--height {
  text-align: right;
  white-space: nowrap;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  width: var(--cat-col-h);
  min-width: var(--cat-col-h);
}

.catalog-matrix__height-placeholder {
  color: var(--color-text-muted);
}

.catalog-matrix__td--order {
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.72rem;
  white-space: nowrap;
  text-align: left;
}

.catalog-matrix__td--lr {
  text-align: center;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  width: var(--cat-col-lr);
  min-width: var(--cat-col-lr);
}

.catalog-matrix__td--price {
  text-align: center;
  width: 3.35rem;
  min-width: 3.35rem;
  max-width: 3.75rem;
  padding: 0.25rem 0.2rem;
  font-variant-numeric: tabular-nums;
}

.catalog-matrix__col--stripe {
  background: var(--cat-stripe) !important;
}

.catalog-matrix__th--price-index.catalog-matrix__col--stripe {
  background: var(--cat-stripe) !important;
}

.catalog-matrix__td--actions {
  text-align: center;
  width: 3.75rem;
  min-width: 3.75rem;
  max-width: 3.75rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

/* Height first, then width — scroll with horizontal prices */
.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-h {
  position: sticky;
  left: 0;
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-w {
  position: sticky;
  left: var(--cat-col-h);
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-o {
  position: sticky;
  left: calc(var(--cat-col-h) + var(--cat-col-w));
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-lr {
  position: sticky;
  left: calc(var(--cat-col-h) + var(--cat-col-w) + var(--cat-col-o));
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

/* Series fixes carcase height — only width + order + L/R stick */
.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-w-only {
  position: sticky;
  left: 0;
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-o {
  position: sticky;
  left: var(--cat-col-w);
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-lr {
  position: sticky;
  left: calc(var(--cat-col-w) + var(--cat-col-o));
  z-index: 3;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix__price-btn {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: center;
  padding: 0.15rem 0;
}

.catalog-matrix__price-btn:hover {
  color: var(--color-brand);
  text-decoration: underline;
}

.catalog-matrix__price-add {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: center;
  padding: 0.15rem 0;
}

.catalog-matrix__price-add:hover {
  color: var(--color-brand);
}

.catalog-matrix__empty-row {
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.75rem;
}

.catalog-matrix__inline-link {
  margin-left: 0.35rem;
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--color-brand);
  cursor: pointer;
  text-decoration: underline;
}

.catalog-depth-section {
  margin-top: 1rem;
}

.catalog-depth-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.5rem;
}

.catalog-depth-section__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  letter-spacing: 0.02em;
}

.catalog-depth-section__empty {
  margin: 0;
  padding: 0.5rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.catalog-depth-matrix {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.75rem;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: 'tnum' 1;
}

.catalog-depth-matrix__th,
.catalog-depth-matrix__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.35rem 0.45rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.catalog-depth-matrix__th:last-child,
.catalog-depth-matrix__td:last-child {
  border-right: none;
}

.catalog-depth-matrix tbody tr:last-child .catalog-depth-matrix__td {
  border-bottom: none;
}

.catalog-depth-matrix__row:hover .catalog-depth-matrix__td {
  background: var(--color-surface-hover);
}

.catalog-depth-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: left;
}

.catalog-depth-matrix__th-name {
  width: auto;
  min-width: 6rem;
}

.catalog-depth-matrix__th-mm {
  width: 5.25rem;
  text-align: right;
}

.catalog-depth-matrix__th-edit {
  width: 3.75rem;
  min-width: 3.75rem;
  max-width: 3.75rem;
  text-align: right;
  font-size: 0.7rem;
}

.catalog-depth-matrix__th-remove {
  width: 4.25rem;
  min-width: 4.25rem;
  max-width: 4.25rem;
  text-align: right;
  font-size: 0.7rem;
}

.catalog-depth-matrix__td-name {
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
  word-break: break-word;
}

.catalog-depth-matrix__td-mm {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.catalog-depth-matrix__td-edit,
.catalog-depth-matrix__td-remove {
  text-align: right;
  white-space: nowrap;
  vertical-align: middle;
}

.catalog-depth-matrix__td-edit :deep(.base-btn),
.catalog-depth-matrix__td-remove :deep(.base-btn) {
  font-size: 0.78rem;
}

</style>
