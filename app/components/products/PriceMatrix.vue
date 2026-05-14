<template>
  <div v-if="priceClasses.length === 0" class="catalog-matrix__no-classes">
    Add
    <NuxtLink to="/price-classes" class="catalog-matrix__inline-link-nav">price classes</NuxtLink>
    to see the price grid (groups 0, 1, 2&hellip;) for each variant.
  </div>
  <div v-else class="catalog-matrix-wrap">
    <table
      class="catalog-matrix"
      :class="locksVariantHeight ? 'catalog-matrix--variant-height-hidden' : 'catalog-matrix--variant-height-visible'"
    >
      <thead>
        <tr>
          <th
            v-if="!locksVariantHeight"
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
            :class="locksVariantHeight ? 'catalog-matrix__sticky-stack-w-only' : 'catalog-matrix__sticky-stack-w'"
          >
            Width <span class="catalog-matrix__th-sub">(mm)</span>
          </th>
          <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--order catalog-matrix__sticky-stack-o">Order no.</th>
          <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--sticky catalog-matrix__th--lr catalog-matrix__sticky-stack-lr">L/R</th>
          <th :colspan="priceClasses.length" scope="colgroup" class="catalog-matrix__th catalog-matrix__th--price-groups-banner">Price groups</th>
          <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--action-edit" aria-label="Edit" />
          <th rowspan="2" scope="col" class="catalog-matrix__th catalog-matrix__th--action-remove" aria-label="Remove" />
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
        <tr v-for="variant in variants" :key="variant.documentId" class="catalog-matrix__row">
          <td
            v-if="!locksVariantHeight"
            class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--height catalog-matrix__sticky-stack-h"
          >
            <template v-if="variant.height != null">{{ variant.height }}</template>
            <span v-else class="catalog-matrix__height-placeholder">—</span>
          </td>
          <td
            class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--width"
            :class="locksVariantHeight ? 'catalog-matrix__sticky-stack-w-only' : 'catalog-matrix__sticky-stack-w'"
          >
            {{ variantWidthCell(variant) }}
          </td>
          <td class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--order catalog-matrix__td-mono catalog-matrix__sticky-stack-o">
            {{ variant.orderNumber }}
          </td>
          <td class="catalog-matrix__td catalog-matrix__td--sticky catalog-matrix__td--lr catalog-matrix__sticky-stack-lr">
            {{ lrCellLabel }}
          </td>
          <td
            v-for="(pc, pcIdx) in priceClasses"
            :key="`${variant.documentId}-${pc.documentId}`"
            class="catalog-matrix__td catalog-matrix__td--price"
            :class="{ 'catalog-matrix__col--stripe': isPriceStripeColumn(pcIdx) }"
          >
            <template v-if="priceCell(variant, pc)">
              <button type="button" class="catalog-matrix__price-btn" @click="$emit('edit-price', priceCell(variant, pc)!)">
                {{ formatPriceValue(priceCell(variant, pc)!.price) }}
              </button>
            </template>
            <button
              v-else
              type="button"
              class="catalog-matrix__price-add"
              :title="`Add price for ${variant.orderNumber} — group ${pc.level} (${pc.name})`"
              @click="$emit('add-price', variant, pc)"
            >
              —
            </button>
          </td>
          <td class="catalog-matrix__td catalog-matrix__td--action-edit">
            <BaseButton type="button" variant="text" size="sm" @click="$emit('edit-variant', variant)"> Edit </BaseButton>
          </td>
          <td class="catalog-matrix__td catalog-matrix__td--action-remove">
            <BaseButton
              type="button"
              variant="text"
              danger
              size="sm"
              :disabled="variantDeletingDocumentId !== null"
              :loading="variantDeletingDocumentId === variant.documentId"
              @click="$emit('delete-variant', variant)"
            >
              Remove
            </BaseButton>
          </td>
        </tr>
        <tr v-if="variants.length === 0">
          <td :colspan="(locksVariantHeight ? 3 : 4) + priceClasses.length + 2" class="catalog-matrix__empty-row">
            No variants yet.
            <button type="button" class="catalog-matrix__inline-link" @click="$emit('add-variant')">Add variant</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationDocumentId, extractRelationNumericId } from '../../utils/strapiRelationMeta';
import type { CabinetType } from '../../services/cabinet-types';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';
import type { PriceClass } from '../../services/price-classes';

const props = defineProps<{
  cabinetType: CabinetType;
  variants: CabinetVariant[];
  priceClasses: PriceClass[];
  pricesByVariantId: Record<number, CabinetPrice[]>;
  locksVariantHeight: boolean;
  variantDeletingDocumentId: string | null;
}>();

defineEmits<{
  'add-variant': [];
  'edit-variant': [v: CabinetVariant];
  'delete-variant': [v: CabinetVariant];
  'edit-price': [p: CabinetPrice];
  'add-price': [v: CabinetVariant, pc: PriceClass];
}>();

const lrCellLabel = computed(() => (props.cabinetType.hasLeftRight ? 'L/R' : '—'));

function variantWidthCell(v: CabinetVariant): string {
  return v.isVariableWidth && v.minWidth != null && v.maxWidth != null ? `${v.minWidth}–${v.maxWidth}` : String(v.width);
}

function isPriceStripeColumn(index: number): boolean {
  return index % 2 === 1;
}

function priceClassTooltip(pc: PriceClass): string {
  return `${pc.name} (group ${pc.level})`;
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
</script>

<style scoped>
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
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
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

.catalog-matrix__th:last-child:not(.catalog-matrix__th--price-index):not(.catalog-matrix__th--action-remove),
.catalog-matrix__td:last-child:not(.catalog-matrix__td--action-remove) {
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
  background: var(--cat-header-band) !important;
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

.catalog-matrix__th--action-edit {
  width: 4.75rem;
  min-width: 4.75rem;
  max-width: 4.75rem;
  text-align: center;
  font-size: 0.7rem;
}

.catalog-matrix__th--action-remove {
  width: 5.75rem;
  min-width: 5.75rem;
  max-width: 5.75rem;
  text-align: center;
  font-size: 0.7rem;
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

.catalog-matrix__td--action-edit {
  text-align: center;
  width: 4.75rem;
  min-width: 4.75rem;
  max-width: 4.75rem;
  vertical-align: middle;
  white-space: nowrap;
  background: var(--color-surface-card);
}

.catalog-matrix__td--action-remove {
  text-align: center;
  width: 5.75rem;
  min-width: 5.75rem;
  max-width: 5.75rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.catalog-matrix__td--action-edit :deep(.base-btn),
.catalog-matrix__td--action-remove :deep(.base-btn) {
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
  font-size: 0.78rem;
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-h {
  position: sticky;
  left: 0;
  z-index: 3;
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-w {
  position: sticky;
  left: var(--cat-col-h);
  z-index: 3;
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-o {
  position: sticky;
  left: calc(var(--cat-col-h) + var(--cat-col-w));
  z-index: 3;
}

.catalog-matrix--variant-height-visible .catalog-matrix__sticky-stack-lr {
  position: sticky;
  left: calc(var(--cat-col-h) + var(--cat-col-w) + var(--cat-col-o));
  z-index: 3;
  border-right: none;
  box-shadow: 1px 0 0 var(--color-border);
}

.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-w-only {
  position: sticky;
  left: 0;
  z-index: 3;
}

.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-o {
  position: sticky;
  left: var(--cat-col-w);
  z-index: 3;
}

.catalog-matrix--variant-height-hidden .catalog-matrix__sticky-stack-lr {
  position: sticky;
  left: calc(var(--cat-col-w) + var(--cat-col-o));
  z-index: 3;
  border-right: none;
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
</style>
