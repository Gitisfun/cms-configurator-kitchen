<template>
  <section class="catalog-overview-section">
    <div class="catalog-overview-section__card">
      <header class="catalog-overview-section__card-head">
        <div class="catalog-overview-section__card-head-main">
          <h2 class="catalog-overview-section__title">{{ series.name }}</h2>
          <p class="catalog-overview-section__dims">
            <span v-if="series.carcaseHeight != null">Carcase height {{ series.carcaseHeight }} mm</span>
            <span v-if="series.carcaseHeight != null && series.defaultCarcaseDepth != null" class="catalog-overview-section__dims-sep">·</span>
            <span v-if="series.defaultCarcaseDepth != null">Default depth {{ series.defaultCarcaseDepth }} mm</span>
            <span v-if="series.carcaseHeight == null && series.defaultCarcaseDepth == null">Dimensions not set</span>
          </p>
        </div>
        <NuxtLink :to="`/catalog/${series.documentId}`" class="catalog-overview-section__edit-link">
          <Icon name="lucide:pencil" class="catalog-overview-section__edit-icon" />
          Edit
        </NuxtLink>
      </header>

      <div class="catalog-overview-section__card-body">
        <p v-if="priceClasses.length === 0" class="catalog-overview-section__no-pc">
          No price classes yet. Add them under
          <NuxtLink to="/price-classes" class="catalog-overview-section__inline-link">Price classes</NuxtLink>
          to show price columns.
        </p>

        <p v-else-if="sortedTypes.length === 0" class="catalog-overview-section__empty-types">No cabinet types in this series.</p>

        <div v-else class="catalog-overview-section__table-scroll">
          <table class="catalog-overview-matrix" :class="locksVariantHeight ? 'catalog-overview-matrix--height-locked' : ''">
            <thead>
              <tr>
                <th rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--image" aria-label="Image" />
                <th rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--detail" aria-label="Cabinet type" />
                <th v-if="!locksVariantHeight" rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--height">Height <span class="catalog-overview-matrix__th-sub">(mm)</span></th>
                <th rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--width">Width <span class="catalog-overview-matrix__th-sub">(mm)</span></th>
                <th rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--order">Order no.</th>
                <th rowspan="2" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--lr">L/R</th>
                <th :colspan="priceClasses.length" scope="colgroup" class="catalog-overview-matrix__th catalog-overview-matrix__th--price-banner">Price groups</th>
              </tr>
              <tr>
                <th v-for="pc in priceClasses" :key="pc.documentId" scope="col" class="catalog-overview-matrix__th catalog-overview-matrix__th--price-idx" :title="`${pc.name} (group ${pc.level})`">
                  <span class="catalog-overview-matrix__price-num">{{ pc.level }}</span>
                </th>
              </tr>
            </thead>
            <tbody v-for="ct in sortedTypes" :key="ct.documentId">
              <tr v-for="(row, rowIdx) in typeRows(ct)" :key="row.variant?.documentId ?? `${ct.documentId}-empty`">
                <td v-if="rowIdx === 0" class="catalog-overview-matrix__td catalog-overview-matrix__td--image" :rowspan="typeRowspan(ct)">
                  <img v-if="typeImageSrc(ct)" :src="typeImageSrc(ct)!" alt="" class="catalog-overview-matrix__type-img" loading="lazy" />
                  <div v-else class="catalog-overview-matrix__type-img-ph" aria-hidden="true">
                    <Icon name="lucide:image" />
                  </div>
                </td>
                <td v-if="rowIdx === 0" class="catalog-overview-matrix__td catalog-overview-matrix__td--detail" :rowspan="typeRowspan(ct)">
                  <span class="catalog-overview-matrix__type-name">{{ ct.name }}</span>
                  <span v-if="ct.description" class="catalog-overview-matrix__type-desc">{{ ct.description }}</span>
                </td>
                <td v-if="!locksVariantHeight" class="catalog-overview-matrix__td catalog-overview-matrix__td--height">
                  <template v-if="row.variant?.height != null">{{ row.variant.height }}</template>
                  <span v-else>—</span>
                </td>
                <td class="catalog-overview-matrix__td catalog-overview-matrix__td--width">
                  {{ row.variant ? variantWidthLabel(row.variant) : '—' }}
                </td>
                <td class="catalog-overview-matrix__td catalog-overview-matrix__td--order catalog-overview-matrix__mono">
                  {{ row.variant?.orderNumber ?? '—' }}
                </td>
                <td class="catalog-overview-matrix__td catalog-overview-matrix__td--lr">
                  {{ lrLabel(ct) }}
                </td>
                <td v-for="pc in priceClasses" :key="`${row.variant?.documentId ?? 'empty'}-${pc.documentId}`" class="catalog-overview-matrix__td catalog-overview-matrix__td--price">
                  <template v-if="row.variant">
                    {{ priceDisplay(row.variant, pc) }}
                  </template>
                  <template v-else>—</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationDocumentId, extractRelationNumericId } from '../../utils/strapiRelationMeta';
import type { CabinetSeries } from '../../models/cabinet-series';
import type { CabinetType } from '../../models/cabinet-type';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';
import type { PriceClass } from '../../services/price-classes';

const props = defineProps<{
  series: CabinetSeries;
  types: CabinetType[];
  priceClasses: PriceClass[];
  pricesByVariantId: Record<number, CabinetPrice[]>;
  locksVariantHeight: boolean;
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const sortedTypes = computed(() => [...props.types].sort((a, b) => a.name.localeCompare(b.name)));

function sortedVariants(ct: CabinetType): CabinetVariant[] {
  const list = strapiRelationList<CabinetVariant>(ct.variants);
  return [...list].sort((a, b) => {
    if (a.width !== b.width) return a.width - b.width;
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return ah - bh;
    return a.orderNumber.localeCompare(b.orderNumber);
  });
}

function typeRows(ct: CabinetType): { variant: CabinetVariant | null }[] {
  const v = sortedVariants(ct);
  if (v.length === 0) return [{ variant: null }];
  return v.map((variant) => ({ variant }));
}

function typeRowspan(ct: CabinetType): number {
  const n = sortedVariants(ct).length;
  return n > 0 ? n : 1;
}

function typeImageSrc(ct: CabinetType): string | null {
  return extractPlinthImage(ct, strapiPublicUrl.value).src;
}

function variantWidthLabel(v: CabinetVariant): string {
  return v.isVariableWidth && v.minWidth != null && v.maxWidth != null ? `${v.minWidth}–${v.maxWidth}` : String(v.width);
}

function lrLabel(ct: CabinetType): string {
  return ct.hasLeftRight ? 'L/R' : '—';
}

function priceClassMatches(rel: unknown, pc: PriceClass): boolean {
  const id = extractRelationNumericId(rel);
  if (id != null && id === pc.id) return true;
  const doc = extractRelationDocumentId(rel);
  return doc != null && doc === pc.documentId;
}

function pricesOf(variant: CabinetVariant): CabinetPrice[] {
  const nested = strapiRelationList<CabinetPrice>(variant.prices);
  const extra = props.pricesByVariantId[variant.id] ?? [];
  const byDoc = new Map<string, CabinetPrice>();
  for (const p of nested) byDoc.set(p.documentId, p);
  for (const p of extra) byDoc.set(p.documentId, p);
  return [...byDoc.values()];
}

function priceCell(variant: CabinetVariant, pc: PriceClass): CabinetPrice | null {
  return pricesOf(variant).find((p) => priceClassMatches(p.priceClass, pc)) ?? null;
}

function formatPriceValue(p: number | string): string {
  const n = typeof p === 'number' ? p : Number(p);
  if (!Number.isFinite(n)) return String(p);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function priceDisplay(variant: CabinetVariant, pc: PriceClass): string {
  const cell = priceCell(variant, pc);
  if (!cell) return '—';
  return formatPriceValue(cell.price);
}
</script>

<style scoped>
.catalog-overview-section {
  margin-bottom: 2rem;
}

.catalog-overview-section:last-child {
  margin-bottom: 0;
}

.catalog-overview-section__card {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.catalog-overview-section__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.catalog-overview-section__card-body {
  min-width: 0;
}

.catalog-overview-section__table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.catalog-overview-section__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.25;
}

.catalog-overview-section__dims {
  margin: 0.25rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.catalog-overview-section__dims-sep {
  margin: 0 0.35rem;
}

.catalog-overview-section__edit-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand);
  text-decoration: none;
  white-space: nowrap;
}

.catalog-overview-section__edit-link:hover {
  text-decoration: underline;
}

.catalog-overview-section__edit-icon {
  width: 1rem;
  height: 1rem;
}

.catalog-overview-section__no-pc,
.catalog-overview-section__empty-types {
  margin: 0;
  padding: 1rem 1.25rem 1.25rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.catalog-overview-section__inline-link {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.catalog-overview-section__inline-link:hover {
  text-decoration: underline;
}

.catalog-overview-matrix {
  --co-banner: rgba(34, 197, 94, 0.12);
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.75rem;
  font-feature-settings: 'tnum' 1;
}

.catalog-overview-matrix__th,
.catalog-overview-matrix__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem;
  text-align: left;
  vertical-align: top;
  background: var(--color-surface-card);
}

.catalog-overview-matrix__th:last-child,
.catalog-overview-matrix__td:last-child {
  border-right: none;
}

.catalog-overview-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.catalog-overview-matrix__th-sub {
  display: block;
  font-weight: var(--font-weight-regular);
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.catalog-overview-matrix__th--image {
  width: 7rem;
  min-width: 7rem;
  padding: 0.35rem;
}

.catalog-overview-matrix__th--detail {
  min-width: 10rem;
  width: 12rem;
}

.catalog-overview-matrix__th--height {
  text-align: center;
  width: 3.25rem;
}

.catalog-overview-matrix__th--width {
  text-align: center;
  width: 4.25rem;
}

.catalog-overview-matrix__th--order {
  width: 3.25rem;
  min-width: 3rem;
  text-align: center;
}

.catalog-overview-matrix__th--lr {
  text-align: center;
  width: 2.25rem;
}

.catalog-overview-matrix__th--price-banner {
  text-align: center;
  background: var(--co-banner);
  color: var(--color-text-primary);
}

.catalog-overview-matrix__th--price-idx {
  text-align: center;
  width: 3rem;
  min-width: 2.75rem;
}

.catalog-overview-matrix__price-num {
  font-variant-numeric: tabular-nums;
}

.catalog-overview-matrix__td--image {
  padding: 0.5rem 0.45rem;
  text-align: center;
  vertical-align: top;
}

.catalog-overview-matrix__td--detail {
  padding: 0.65rem 0.6rem 0.65rem 0.35rem;
  vertical-align: top;
}

.catalog-overview-matrix__td--height,
.catalog-overview-matrix__td--width,
.catalog-overview-matrix__td--lr {
  text-align: center;
  vertical-align: middle;
}

.catalog-overview-matrix__td--order {
  vertical-align: middle;
  text-align: center;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}

.catalog-overview-matrix__td--price {
  text-align: center;
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}

.catalog-overview-matrix__mono {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
}

.catalog-overview-matrix__type-img {
  display: block;
  width: 180px;
  height: 180px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  margin-bottom: 0;
  object-fit: contain;
  object-position: top center;
  border-radius: var(--button-radius);
}

.catalog-overview-matrix__type-img-ph {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 180px;
  height: 180px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 0.25rem;
  box-sizing: border-box;
  border-radius: var(--button-radius);
  color: var(--color-text-muted);
}

.catalog-overview-matrix__type-img-ph svg {
  width: 1.5rem;
  height: 1.5rem;
}

.catalog-overview-matrix__type-name {
  display: block;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
}

.catalog-overview-matrix__type-desc {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  line-height: 1.35;
  white-space: pre-wrap;
}

.catalog-overview-matrix tbody + tbody tr:first-child .catalog-overview-matrix__td {
  border-top: 2px solid color-mix(in srgb, var(--color-border) 70%, var(--color-text-muted));
}
</style>
