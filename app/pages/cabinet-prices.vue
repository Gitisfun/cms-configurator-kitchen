<template>
  <div>
    <CmsPageHeader title="Cabinet Prices" description="Manage cabinet pricing entries. Choose a variant and price class, then add the amount.">
      <template #actions>
        <div class="cabinet-prices-page__create">
          <label class="cabinet-prices-page__field-label" for="cabinet-price-variant-pick">Cabinet variant</label>
          <select
            id="cabinet-price-variant-pick"
            v-model="selectedVariantIdRaw"
            class="cabinet-prices-page__select"
            :disabled="variantsLoading || relationsLoadError !== ''"
            aria-label="Cabinet variant for new price"
          >
            <option value="">— Select variant —</option>
            <option v-for="cv in variantOptions" :key="cv.documentId" :value="String(cv.id)">
              {{ cv.orderNumber }} ({{ cv.width }} mm)
            </option>
          </select>
          <label class="cabinet-prices-page__field-label" for="cabinet-price-class-pick">Price class</label>
          <select
            id="cabinet-price-class-pick"
            v-model="selectedPriceClassIdRaw"
            class="cabinet-prices-page__select"
            :disabled="priceClassesLoading || relationsLoadError !== ''"
            aria-label="Price class for new price"
          >
            <option value="">— Select class —</option>
            <option v-for="pc in priceClassOptions" :key="pc.documentId" :value="String(pc.id)">
              {{ pc.name }} (level {{ pc.level }})
            </option>
          </select>
          <BaseButton type="button" :disabled="!canOpenCreatePrice" @click="openCreateForSelection">
            <Icon name="lucide:plus" class="base-btn__icon" />
            Add price
          </BaseButton>
        </div>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'price' : 'prices' }}
      </template>
      <template #loading>Loading cabinet prices&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load cabinet prices.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:tag" />
        </div>
        <h3 class="base-panel__empty-title">No cabinet prices yet</h3>
        <p v-if="relationsLoadError" class="base-panel__empty-desc">{{ relationsLoadError }}</p>
        <p v-else class="base-panel__empty-desc">Select a cabinet variant and price class above, then add a price.</p>
        <BaseButton type="button" :disabled="!canOpenCreatePrice" @click="openCreateForSelection">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create price
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No prices on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Price</th>
            <th scope="col">Cabinet Variant</th>
            <th scope="col">Price Class</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:tag" />
              </span>
              <span class="base-table__name-text">{{ formatPrice(row.price) }}</span>
            </div>
          </td>
          <td>{{ variantLabel(row) }}</td>
          <td>{{ priceClassLabel(row) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Cabinet price pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetPrice ref="priceModalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  cabinetPricesListPath,
  cabinetPricesListQuery,
  defaultCabinetPricesResponse,
  deleteCabinetPrice,
  type CabinetPrice,
  type CabinetPricesResponse,
} from '../services/cabinet-prices';
import { getAllCabinetVariants, type CabinetVariant } from '../services/cabinet-variants';
import { getPriceClassesSortedByLevel, type PriceClass } from '../services/price-classes';

const PAGE_SIZE = 25;
const page = ref(1);

const priceModalRef = ref<{
  openCreateForVariantAndPriceClass: (v: CabinetVariant, pc: PriceClass) => void;
  openEdit: (row: CabinetPrice) => void;
} | null>(null);

const variantOptions = ref<CabinetVariant[]>([]);
const priceClassOptions = ref<PriceClass[]>([]);
const variantsLoading = ref(false);
const priceClassesLoading = ref(false);
const relationsLoadError = ref('');
const selectedVariantIdRaw = ref('');
const selectedPriceClassIdRaw = ref('');

const canOpenCreatePrice = computed(() => {
  if (relationsLoadError.value || variantsLoading.value || priceClassesLoading.value) return false;
  const v = Number(selectedVariantIdRaw.value.trim());
  const p = Number(selectedPriceClassIdRaw.value.trim());
  return Number.isFinite(v) && v > 0 && Number.isFinite(p) && p > 0;
});

onMounted(async () => {
  relationsLoadError.value = '';
  variantsLoading.value = true;
  priceClassesLoading.value = true;
  try {
    const [vRes, pcRes] = await Promise.all([
      getAllCabinetVariants(1, 500),
      getPriceClassesSortedByLevel(200),
    ]);
    variantOptions.value = vRes.data;
    priceClassOptions.value = pcRes.data;
  } catch {
    relationsLoadError.value = 'Could not load variants or price classes. You can still edit existing prices.';
  } finally {
    variantsLoading.value = false;
    priceClassesLoading.value = false;
  }
});

function openCreateForSelection() {
  const vid = Number(selectedVariantIdRaw.value.trim());
  const pcid = Number(selectedPriceClassIdRaw.value.trim());
  if (!Number.isFinite(vid) || !Number.isFinite(pcid)) return;
  const variant = variantOptions.value.find((v) => v.id === vid);
  const pc = priceClassOptions.value.find((p) => p.id === pcid);
  if (!variant || !pc) return;
  priceModalRef.value?.openCreateForVariantAndPriceClass(variant, pc);
}

function openEditModal(row: CabinetPrice) {
  priceModalRef.value?.openEdit(row);
}

const { data, pending, error, refresh } = useFetch<CabinetPricesResponse>(cabinetPricesListPath, {
  key: computed(() => `cabinet-prices-p${page.value}`),
  query: computed(() => cabinetPricesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetPricesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const deletingDocumentId = ref<string | null>(null);

function relationField(rel: unknown, field: string): string {
  if (!rel) return '—';
  if (typeof rel === 'object' && field in rel!) return String((rel as Record<string, unknown>)[field] ?? '—');
  if (typeof rel === 'object' && 'data' in rel!) {
    const d = (rel as { data: Record<string, unknown> | null }).data;
    return d ? String(d[field] ?? '—') : '—';
  }
  return '—';
}

function variantLabel(row: CabinetPrice): string {
  return relationField(row.cabinetVariant, 'orderNumber');
}

function priceClassLabel(row: CabinetPrice): string {
  const name = relationField(row.priceClass, 'name');
  if (name === '—') return '—';
  const level = relationField(row.priceClass, 'level');
  return level !== '—' ? `${name} (${level})` : name;
}

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetPrice) {
  if (!window.confirm(`Delete this cabinet price? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetPrice(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete cabinet price.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>

<style scoped>
.cabinet-prices-page__create {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1rem;
}

.cabinet-prices-page__field-label {
  display: block;
  width: 100%;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  margin: 0;
}

@media (min-width: 720px) {
  .cabinet-prices-page__field-label {
    width: auto;
    align-self: center;
    padding-bottom: 0.375rem;
  }
}

.cabinet-prices-page__select {
  min-width: 11rem;
  max-width: min(20rem, 100%);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
}

.cabinet-prices-page__select:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.cabinet-prices-page__select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
