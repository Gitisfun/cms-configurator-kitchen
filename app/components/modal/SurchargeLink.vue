<template>
  <BaseModal
    v-model="modalOpen"
    title-id="surcharge-link-modal-title"
    :title="editing ? 'Edit surcharge link' : 'Link surcharge'"
    size="medium"
    :close-disabled="formSaving"
    :close-on-backdrop="!formSaving"
  >
    <form id="surcharge-link-modal-form" @submit.prevent="submitModal">
      <p v-if="cabinetTypeLabel" class="sl-modal__context">
        Cabinet type: <strong>{{ cabinetTypeLabel }}</strong>
      </p>

      <template v-if="!editing">
        <div class="sl-modal__field">
          <span class="sl-modal__label">
            Surcharge
            <span class="sl-modal__req" aria-hidden="true">*</span>
          </span>
          <select
            v-model="formSurchargeIdRaw"
            class="sl-modal__select cms-native-select"
            :disabled="formSaving || surchargesLoading"
            required
          >
            <option value="" disabled>
              {{ surchargesLoading ? 'Loading surcharges…' : '— Select a surcharge —' }}
            </option>
            <option v-for="opt in availableSurcharges" :key="opt.documentId" :value="String(opt.id)">
              {{ opt.name }} ({{ opt.code }}){{ opt.dimension ? ` · ${dimensionLabel(opt.dimension)}` : '' }}
            </option>
          </select>
          <p v-if="!surchargesLoading && availableSurcharges.length === 0" class="sl-modal__hint">
            No surcharges available. Create one under
            <NuxtLink to="/cabinet-type-surcharges" class="sl-modal__link" @click="modalOpen = false">Surcharges</NuxtLink>,
            or every surcharge is already linked to this cabinet type.
          </p>
        </div>
      </template>

      <template v-else>
        <p class="sl-modal__context sl-modal__context--surcharge">
          Surcharge: <strong>{{ editingSurchargeLabel }}</strong>
        </p>
      </template>

      <div class="sl-modal__prices">
        <p class="sl-modal__label sl-modal__label--section">Prices per price group</p>
        <p v-if="priceClasses.length === 0" class="sl-modal__hint">
          No price classes defined. Add them under
          <NuxtLink to="/price-classes" class="sl-modal__link" @click="modalOpen = false">Price classes</NuxtLink>
          to set prices here.
        </p>
        <table v-else class="sl-modal__table">
          <thead>
            <tr>
              <th scope="col" class="sl-modal__th sl-modal__th-level">#</th>
              <th scope="col" class="sl-modal__th">Name</th>
              <th scope="col" class="sl-modal__th sl-modal__th-price">Price (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pc in priceClasses" :key="pc.documentId">
              <td class="sl-modal__td sl-modal__td-level">{{ pc.level }}</td>
              <td class="sl-modal__td">{{ pc.name }}</td>
              <td class="sl-modal__td sl-modal__td-price">
                <input
                  v-model="priceByClassId[pc.id]"
                  class="sl-modal__input"
                  type="number"
                  step="0.01"
                  min="0"
                  inputmode="decimal"
                  :disabled="formSaving"
                  :aria-label="`Price for ${pc.name}`"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p class="sl-modal__hint">Leave a field empty to skip that price group.</p>
      </div>

      <p v-if="formError" class="base-modal__error">{{ formError }}</p>
    </form>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="formSaving" @click="closeModal"> Cancel </BaseButton>
      <BaseButton
        type="submit"
        form="surcharge-link-modal-form"
        variant="primary"
        :disabled="formSaving"
        :loading="formSaving"
      >
        {{ formSaving ? 'Saving…' : editing ? 'Save' : 'Link surcharge' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { extractRelationNumericId } from '../../utils/strapiRelationMeta';
import {
  getAllCabinetTypeSurcharges,
  type CabinetTypeSurcharge,
} from '../../services/cabinet-type-surcharges';
import type { CabinetTypeSurchargeDimension } from '../../models/cabinet-type-surcharge';
import {
  createCabinetTypeSurchargeLink,
  updateCabinetTypeSurchargeLink,
  type CabinetTypeSurchargeLink,
  type SurchargeLinkPriceInput,
} from '../../services/cabinet-type-surcharge-links';
import type { CabinetTypeSurchargePrice } from '../../models/cabinet-type-surcharge-price';
import type { PriceClass } from '../../services/price-classes';

const emit = defineEmits<{
  saved: [];
}>();

type OpenCreateArgs = {
  cabinetTypeId: number;
  cabinetTypeLabel?: string;
  alreadyLinkedSurchargeDocumentIds: string[];
  priceClasses: PriceClass[];
};

type OpenEditArgs = {
  link: CabinetTypeSurchargeLink;
  cabinetTypeLabel?: string;
  priceClasses: PriceClass[];
};

const modalOpen = ref(false);
const editing = ref<CabinetTypeSurchargeLink | null>(null);
const cabinetTypeId = ref<number | null>(null);
const cabinetTypeLabel = ref('');
const alreadyLinkedDocumentIds = ref<Set<string>>(new Set());
const priceClasses = ref<PriceClass[]>([]);

const allSurcharges = ref<CabinetTypeSurcharge[]>([]);
const surchargesLoading = ref(false);

const formSurchargeIdRaw = ref('');
const priceByClassId = ref<Record<number, string>>({});
const formError = ref('');
const formSaving = ref(false);

const availableSurcharges = computed(() => {
  return allSurcharges.value.filter((s) => !alreadyLinkedDocumentIds.value.has(s.documentId));
});

const editingSurchargeLabel = computed(() => {
  const row = editing.value;
  if (!row) return '';
  const s = extractSurcharge(row);
  if (!s) return '';
  const suffix = s.dimension ? ` · ${dimensionLabel(s.dimension)}` : '';
  return `${s.name} (${s.code})${suffix}`;
});

function extractSurcharge(row: CabinetTypeSurchargeLink): CabinetTypeSurcharge | null {
  const r = row.surcharge;
  if (!r) return null;
  if (typeof r === 'object' && 'data' in r) return (r.data as CabinetTypeSurcharge | null) ?? null;
  return r as CabinetTypeSurcharge;
}

function dimensionLabel(d: CabinetTypeSurchargeDimension): string {
  if (d === 'height') return 'Height';
  if (d === 'width') return 'Width';
  return 'Depth';
}

async function loadAllSurcharges() {
  surchargesLoading.value = true;
  const pageSize = 100;
  const acc: CabinetTypeSurcharge[] = [];
  try {
    let page = 1;
    let pageCount = 1;
    do {
      const res = await getAllCabinetTypeSurcharges(page, pageSize);
      acc.push(...res.data);
      pageCount = res.meta.pagination.pageCount;
      page++;
    } while (page <= pageCount);
    allSurcharges.value = acc.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    allSurcharges.value = [];
  } finally {
    surchargesLoading.value = false;
  }
}

function openCreate(args: OpenCreateArgs) {
  editing.value = null;
  cabinetTypeId.value = args.cabinetTypeId;
  cabinetTypeLabel.value = args.cabinetTypeLabel?.trim() ?? '';
  alreadyLinkedDocumentIds.value = new Set(
    args.alreadyLinkedSurchargeDocumentIds.filter((d) => d.trim() !== ''),
  );
  priceClasses.value = [...args.priceClasses];
  formSurchargeIdRaw.value = '';
  priceByClassId.value = {};
  formError.value = '';
  modalOpen.value = true;
  void loadAllSurcharges();
}

function openEdit(args: OpenEditArgs) {
  editing.value = args.link;
  cabinetTypeId.value = extractRelationNumericId(args.link.cabinetType);
  cabinetTypeLabel.value = args.cabinetTypeLabel?.trim() ?? '';
  alreadyLinkedDocumentIds.value = new Set();
  priceClasses.value = [...args.priceClasses];
  formSurchargeIdRaw.value = '';

  const priceMap: Record<number, string> = {};
  const rows = strapiRelationList<CabinetTypeSurchargePrice>(args.link.prices);
  for (const pRow of rows) {
    const pcId = extractRelationNumericId(pRow.priceClass);
    if (pcId == null) continue;
    priceMap[pcId] = String(pRow.price);
  }
  priceByClassId.value = priceMap;
  formError.value = '';
  modalOpen.value = true;
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
}

function collectPrices(): SurchargeLinkPriceInput[] | null {
  const out: SurchargeLinkPriceInput[] = [];
  for (const pc of priceClasses.value) {
    const raw = priceByClassId.value[pc.id];
    if (raw == null) continue;
    const trimmed = typeof raw === 'string' ? raw.trim() : String(raw);
    if (trimmed === '') continue;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) {
      formError.value = `Invalid price for "${pc.name}".`;
      return null;
    }
    out.push({ priceClassId: pc.id, price: n });
  }
  return out;
}

async function submitModal() {
  formError.value = '';

  const prices = collectPrices();
  if (prices == null) return;

  formSaving.value = true;
  try {
    if (editing.value) {
      await updateCabinetTypeSurchargeLink(editing.value.documentId, { prices });
    } else {
      const ctId = cabinetTypeId.value;
      const surchargeIdNum = Number(formSurchargeIdRaw.value);
      if (ctId == null || !Number.isFinite(surchargeIdNum) || surchargeIdNum <= 0) {
        formError.value = 'Pick a surcharge to link.';
        formSaving.value = false;
        return;
      }
      await createCabinetTypeSurchargeLink({
        cabinetTypeId: ctId,
        surchargeId: surchargeIdNum,
        prices,
      });
    }
    formSaving.value = false;
    closeModal();
    emit('saved');
  } catch (e: unknown) {
    formError.value = getFetchErrorMessage(e, 'Could not save surcharge link.');
  } finally {
    formSaving.value = false;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
    escKeyHandler = null;
  }
  if (open) {
    escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formSaving.value) closeModal();
    };
    document.addEventListener('keydown', escKeyHandler);
  } else {
    editing.value = null;
    cabinetTypeId.value = null;
    cabinetTypeLabel.value = '';
    alreadyLinkedDocumentIds.value = new Set();
    priceClasses.value = [];
    allSurcharges.value = [];
    formSurchargeIdRaw.value = '';
    priceByClassId.value = {};
    formError.value = '';
  }
});

onUnmounted(() => {
  if (import.meta.client && escKeyHandler) document.removeEventListener('keydown', escKeyHandler);
});

defineExpose({ openCreate, openEdit });
</script>

<style scoped>
.sl-modal__context {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
}

.sl-modal__context--surcharge {
  margin-top: 0.25rem;
}

.sl-modal__field {
  margin-bottom: 0.75rem;
}

.sl-modal__label {
  display: block;
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 0.3rem;
}

.sl-modal__label--section {
  margin-top: 1rem;
}

.sl-modal__req {
  color: var(--color-danger, #dc2626);
  margin-left: 0.15rem;
}

.sl-modal__select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
}

.sl-modal__link {
  color: var(--color-brand);
  text-decoration: underline;
}

.sl-modal__hint {
  margin: 0.4rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.sl-modal__prices {
  margin-top: 0.75rem;
}

.sl-modal__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.78rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  overflow: hidden;
}

.sl-modal__th,
.sl-modal__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem;
  text-align: left;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.sl-modal__th:last-child,
.sl-modal__td:last-child {
  border-right: none;
}

.sl-modal__table tbody tr:last-child .sl-modal__td {
  border-bottom: none;
}

.sl-modal__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.sl-modal__th-level {
  width: 2.5rem;
  text-align: center;
}

.sl-modal__th-price {
  width: 8rem;
  text-align: right;
}

.sl-modal__td-level {
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}

.sl-modal__td-price {
  padding: 0.25rem 0.4rem;
}

.sl-modal__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
  font-size: 0.78rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
