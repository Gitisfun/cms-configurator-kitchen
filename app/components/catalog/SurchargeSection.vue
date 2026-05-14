<template>
  <div class="catalog-depth-section">
    <div class="catalog-depth-section__head">
      <h3 class="catalog-depth-section__title">Surcharges</h3>
      <BaseButton type="button" variant="text" size="sm" @click="$emit('link')">
        <Icon name="lucide:plus" class="base-btn__icon" />
        Link surcharge
      </BaseButton>
    </div>
    <div v-if="surchargeLinks.length > 0" class="catalog-matrix-wrap">
      <table class="catalog-surcharge-matrix">
        <thead>
          <tr>
            <th v-if="!locksVariantHeight" rowspan="2" class="catalog-depth-matrix__th catalog-surcharge-matrix__th-height-spacer" aria-hidden="true" />
            <th rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-surcharge-matrix__th-index">#</th>
            <th rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-name">Surcharge</th>
            <th rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-surcharge-matrix__th-code">Code</th>
            <th v-if="anySurchargeLinkHasDimension" rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-surcharge-matrix__th-dim">Dimension</th>
            <th v-if="priceClasses.length > 0" :colspan="priceClasses.length" scope="colgroup" class="catalog-depth-matrix__th catalog-matrix__th--price-groups-banner">Price groups</th>
            <th rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-edit" aria-label="Edit"></th>
            <th rowspan="2" scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-remove" aria-label="Remove"></th>
          </tr>
          <tr>
            <th
              v-for="(pc, pcIdx) in priceClasses"
              :key="`surcharge-pc-${pc.documentId}`"
              scope="col"
              class="catalog-depth-matrix__th catalog-surcharge-matrix__th-price"
              :class="{ 'catalog-matrix__col--stripe': isPriceStripeColumn(pcIdx) }"
              :title="priceClassTooltip(pc)"
            >
              <span class="catalog-matrix__price-index-num">{{ pc.level }}</span>
              <span class="catalog-matrix__price-index-name">{{ pc.name }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(link, rowIdx) in surchargeLinks" :key="link.documentId" class="catalog-depth-matrix__row">
            <td v-if="!locksVariantHeight" class="catalog-depth-matrix__td catalog-surcharge-matrix__td-height-spacer" aria-hidden="true" />
            <td class="catalog-depth-matrix__td catalog-surcharge-matrix__td-index">{{ rowIdx + 1 }}</td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-name">{{ surchargeLinkName(link) }}</td>
            <td class="catalog-depth-matrix__td catalog-surcharge-matrix__td-code">{{ surchargeLinkCode(link) }}</td>
            <td v-if="anySurchargeLinkHasDimension" class="catalog-depth-matrix__td catalog-surcharge-matrix__td-dim">
              {{ surchargeLinkDimension(link) }}
            </td>
            <td
              v-for="(pc, pcIdx) in priceClasses"
              :key="`surcharge-${link.documentId}-${pc.documentId}`"
              class="catalog-depth-matrix__td catalog-surcharge-matrix__td-price"
              :class="{ 'catalog-matrix__col--stripe': isPriceStripeColumn(pcIdx) }"
            >
              {{ surchargeLinkPriceCell(link, pc) }}
            </td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-edit">
              <BaseButton type="button" variant="text" size="sm" @click="$emit('edit', link)"> Edit </BaseButton>
            </td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-remove">
              <BaseButton
                type="button"
                variant="text"
                danger
                size="sm"
                :disabled="deletingDocumentId !== null"
                :loading="deletingDocumentId === link.documentId"
                @click="$emit('unlink', link)"
              >
                Remove
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="catalog-depth-section__empty">No surcharges linked yet. Use Link surcharge to attach one from the library.</p>
  </div>
</template>

<script setup lang="ts">
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationDocumentId, extractRelationNumericId } from '../../utils/strapiRelationMeta';
import type { PriceClass } from '../../services/price-classes';
import type { CabinetTypeSurcharge, CabinetTypeSurchargeDimension } from '../../models/cabinet-type-surcharge';
import type { CabinetTypeSurchargeLink } from '../../models/cabinet-type-surcharge-link';
import type { CabinetTypeSurchargePrice } from '../../models/cabinet-type-surcharge-price';

const props = defineProps<{
  surchargeLinks: CabinetTypeSurchargeLink[];
  priceClasses: PriceClass[];
  locksVariantHeight: boolean;
  deletingDocumentId: string | null;
}>();

defineEmits<{
  link: [];
  edit: [link: CabinetTypeSurchargeLink];
  unlink: [link: CabinetTypeSurchargeLink];
}>();

function extractSurcharge(link: CabinetTypeSurchargeLink): CabinetTypeSurcharge | null {
  const rel = link.surcharge;
  if (!rel) return null;
  if (typeof rel === 'object' && 'data' in rel) return (rel.data as CabinetTypeSurcharge | null) ?? null;
  return rel as CabinetTypeSurcharge;
}

function surchargeLinkName(link: CabinetTypeSurchargeLink): string {
  return extractSurcharge(link)?.name ?? '—';
}

function surchargeLinkCode(link: CabinetTypeSurchargeLink): string {
  return extractSurcharge(link)?.code ?? '';
}

function dimensionLabel(d: CabinetTypeSurchargeDimension): string {
  if (d === 'height') return 'Height';
  if (d === 'width') return 'Width';
  return 'Depth';
}

function surchargeLinkDimension(link: CabinetTypeSurchargeLink): string {
  const s = extractSurcharge(link);
  if (!s?.dimension) return '—';
  return dimensionLabel(s.dimension);
}

const anySurchargeLinkHasDimension = computed(() =>
  props.surchargeLinks.some((l) => !!extractSurcharge(l)?.dimension),
);

function priceClassMatches(rel: unknown, pc: PriceClass): boolean {
  const id = extractRelationNumericId(rel);
  if (id != null && id === pc.id) return true;
  const doc = extractRelationDocumentId(rel);
  return doc != null && doc === pc.documentId;
}

function surchargeLinkPriceCell(link: CabinetTypeSurchargeLink, pc: PriceClass): string {
  const rows = strapiRelationList<CabinetTypeSurchargePrice>(link.prices);
  const hit = rows.find((p) => priceClassMatches(p.priceClass, pc));
  if (!hit) return '—';
  const n = typeof hit.price === 'number' ? hit.price : Number(hit.price);
  if (!Number.isFinite(n)) return String(hit.price);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function isPriceStripeColumn(index: number): boolean {
  return index % 2 === 1;
}

function priceClassTooltip(pc: PriceClass): string {
  return `${pc.name} (group ${pc.level})`;
}
</script>

<style scoped>
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

.catalog-matrix-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
}

.catalog-surcharge-matrix {
  --cat-col-h: 4.5rem;
  --cat-col-w: 4.5rem;
  --cat-col-o: 8.25rem;
  --cat-col-lr: 2.35rem;
  --cat-header-band: rgba(34, 197, 94, 0.12);
  --cat-stripe: rgba(15, 23, 42, 0.06);

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

.catalog-depth-matrix__th,
.catalog-depth-matrix__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.35rem 0.45rem;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.catalog-surcharge-matrix .catalog-depth-matrix__th:last-child:not(.catalog-surcharge-matrix__th-price),
.catalog-surcharge-matrix .catalog-depth-matrix__td:last-child {
  border-right: none;
}

.catalog-surcharge-matrix tbody tr:last-child .catalog-depth-matrix__td {
  border-bottom: none;
}

.catalog-surcharge-matrix .catalog-depth-matrix__row:hover .catalog-depth-matrix__td {
  background: var(--color-surface-card);
}

.catalog-depth-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: left;
}

.catalog-surcharge-matrix .catalog-depth-matrix__th-name,
.catalog-surcharge-matrix .catalog-depth-matrix__td-name {
  width: var(--cat-col-o);
  min-width: var(--cat-col-o);
  max-width: 10.5rem;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.catalog-surcharge-matrix__th-height-spacer,
.catalog-surcharge-matrix__td-height-spacer {
  width: var(--cat-col-h);
  min-width: var(--cat-col-h);
  max-width: var(--cat-col-h);
}

.catalog-surcharge-matrix__th-index,
.catalog-surcharge-matrix__td-index {
  width: var(--cat-col-w);
  min-width: var(--cat-col-w);
  max-width: var(--cat-col-w);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.catalog-surcharge-matrix__th-index {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.catalog-surcharge-matrix__td-index {
  color: var(--color-text-primary);
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

.catalog-surcharge-matrix__th-code {
  width: var(--cat-col-lr);
  min-width: var(--cat-col-lr);
  max-width: var(--cat-col-lr);
  text-align: center;
  font-size: 0.7rem;
}

.catalog-surcharge-matrix__th-dim {
  width: var(--cat-col-lr);
  min-width: var(--cat-col-lr);
  max-width: var(--cat-col-lr);
  text-align: left;
}

.catalog-depth-matrix__th-edit,
.catalog-surcharge-matrix .catalog-depth-matrix__td-edit {
  width: 4.75rem;
  min-width: 4.75rem;
  max-width: 4.75rem;
  text-align: center;
}

.catalog-surcharge-matrix .catalog-depth-matrix__td-edit :deep(.base-btn) {
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.catalog-depth-matrix__th-remove,
.catalog-surcharge-matrix .catalog-depth-matrix__td-remove {
  width: 5.75rem;
  min-width: 5.75rem;
  max-width: 5.75rem;
  text-align: center;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}

.catalog-surcharge-matrix .catalog-depth-matrix__td-remove :deep(.base-btn) {
  font-size: 0.78rem;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.catalog-surcharge-matrix__th-price {
  width: 3.35rem;
  min-width: 3.35rem;
  max-width: 3.75rem;
  text-align: center;
  vertical-align: bottom;
  padding: 0.25rem 0.2rem 0.35rem;
  line-height: 1.15;
}

.catalog-surcharge-matrix__td-code {
  width: var(--cat-col-lr);
  min-width: var(--cat-col-lr);
  max-width: var(--cat-col-lr);
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.72rem;
  color: var(--color-text-primary);
}

.catalog-surcharge-matrix__td-dim {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.catalog-surcharge-matrix__td-price {
  width: 3.35rem;
  min-width: 3.35rem;
  max-width: 3.75rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.catalog-matrix__col--stripe {
  background: var(--cat-stripe) !important;
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
</style>
