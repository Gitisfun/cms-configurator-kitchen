<template>
  <div class="catalog-type-block">
    <div class="catalog-type-block__summary">
      <div class="catalog-type-block__thumb">
        <img v-if="imageSource" :src="imageSource" alt="" class="catalog-type-block__thumb-img" loading="lazy" />
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
          <span v-if="subcategoryName" class="catalog-type-block__chip">{{ subcategoryName }}</span>
        </p>
      </div>
      <div class="catalog-type-block__actions">
        <BaseButton type="button" variant="text" size="sm" @click="expanded = !expanded">
          <Icon :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="base-btn__icon" />
          {{ expanded ? 'Hide' : 'Variants & prices' }}
        </BaseButton>
        <BaseButton type="button" variant="text" size="sm" @click="$emit('open-edit-type', cabinetType)">
          <Icon name="lucide:pencil" class="base-btn__icon" />
          Edit type
        </BaseButton>
        <BaseButton type="button" variant="text" size="sm" @click="$emit('open-add-variant', cabinetType.id)">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add variant
        </BaseButton>
        <BaseButton
          type="button"
          variant="text"
          danger
          size="sm"
          :loading="deleting"
          @click="confirmDeleteType"
        >
          <Icon name="lucide:trash-2" class="base-btn__icon" />
          Delete type
        </BaseButton>
      </div>
    </div>

    <div v-show="expanded" class="catalog-type-block__detail">
      <ProductsPriceMatrix
        :cabinet-type="cabinetType"
        :variants="sortedVariants"
        :price-classes="priceClasses"
        :prices-by-variant-id="pricesByVariantId"
        :locks-variant-height="locksVariantHeight"
        :variant-deleting-document-id="variantDeletingDocumentId"
        @add-variant="$emit('open-add-variant', cabinetType.id)"
        @edit-variant="(v) => $emit('open-edit-variant', v)"
        @delete-variant="confirmDeleteVariant"
        @edit-price="(p) => $emit('open-edit-price', p)"
        @add-price="(v, pc) => $emit('open-add-price', v, pc)"
      />

      <ProductsDepthSection
        :depth-options="sortedDepthOptions"
        :unlinking-document-id="depthUnlinkingDocumentId"
        @link="onLinkDepthOptions"
        @edit="(opt) => $emit('open-edit-depth-option', opt)"
        @unlink="confirmUnlinkDepthOption"
      />

      <ProductsSurchargeSection
        :surcharge-links="sortedSurchargeLinks"
        :price-classes="priceClasses"
        :locks-variant-height="locksVariantHeight"
        :deleting-document-id="surchargeLinkDeletingDocumentId"
        @link="onLinkSurcharge"
        @edit="onEditSurchargeLink"
        @unlink="confirmUnlinkSurcharge"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import { strapiRelationList } from '../../utils/strapiRelationList';
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { deleteCabinetType, type CabinetType } from '../../services/cabinet-types';
import { deleteCabinetVariant } from '../../services/cabinet-variants';
import { updateDepthOption } from '../../services/depth-options';
import { deleteCabinetTypeSurchargeLink } from '../../services/cabinet-type-surcharge-links';
import type { PriceClass } from '../../services/price-classes';
import type { CabinetVariant } from '../../models/cabinet-variant';
import type { CabinetPrice } from '../../models/cabinet-price';
import type { DepthOption } from '../../models/depth-option';
import type { CabinetTypeSurchargeLink } from '../../models/cabinet-type-surcharge-link';

const props = defineProps<{
  cabinetType: CabinetType;
  priceClasses: PriceClass[];
  locksVariantHeight: boolean;
  pricesByVariantId: Record<number, CabinetPrice[]>;
}>();

const emit = defineEmits<{
  refresh: [];
  'open-edit-type': [ct: CabinetType];
  'open-add-variant': [typeNumericId: number];
  'open-edit-variant': [v: CabinetVariant];
  'open-add-price': [v: CabinetVariant, pc: PriceClass];
  'open-edit-price': [p: CabinetPrice];
  'open-link-depth-options': [ctDocId: string, linkedDocIds: string[], label: string];
  'open-edit-depth-option': [opt: DepthOption];
  'open-link-surcharge': [args: { cabinetTypeId: number; cabinetTypeLabel: string; alreadyLinkedSurchargeDocumentIds: string[]; priceClasses: PriceClass[] }];
  'open-edit-surcharge-link': [args: { link: CabinetTypeSurchargeLink; cabinetTypeLabel: string; priceClasses: PriceClass[] }];
}>();

const strapiPublicUrl = useStrapiPublicUrl();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();

const expanded = ref(false);
const deleting = ref(false);
const variantDeletingDocumentId = ref<string | null>(null);
const depthUnlinkingDocumentId = ref<string | null>(null);
const surchargeLinkDeletingDocumentId = ref<string | null>(null);

const imageSource = computed(() => extractPlinthImage(props.cabinetType, strapiPublicUrl.value).src);

const subcategoryName = computed(() => {
  const sc = props.cabinetType.subcategory;
  if (!sc) return '';
  if (typeof sc === 'object' && sc !== null && 'name' in sc) return (sc as { name: string }).name;
  if (typeof sc === 'object' && sc !== null && 'data' in sc && (sc as { data: { name: string } | null }).data) {
    return (sc as { data: { name: string } }).data.name;
  }
  return '';
});

const sortedVariants = computed(() => {
  const list = strapiRelationList<CabinetVariant>(props.cabinetType.variants);
  return [...list].sort((a, b) => {
    if (a.width !== b.width) return a.width - b.width;
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return ah - bh;
    return a.orderNumber.localeCompare(b.orderNumber);
  });
});

const sortedDepthOptions = computed(() => {
  const list = strapiRelationList<DepthOption>(props.cabinetType.depthOptions);
  return [...list].sort((a, b) => a.depth - b.depth);
});

function extractSurchargeDocumentId(link: CabinetTypeSurchargeLink): string | undefined {
  const rel = link.surcharge;
  if (!rel) return undefined;
  if (typeof rel === 'object' && 'documentId' in rel) return (rel as { documentId?: string }).documentId;
  if (typeof rel === 'object' && 'data' in rel) return ((rel as { data: { documentId?: string } | null }).data)?.documentId;
  return undefined;
}

const sortedSurchargeLinks = computed(() => {
  const list = strapiRelationList<CabinetTypeSurchargeLink>(props.cabinetType.surchargeLinks);
  return [...list].sort((a, b) => {
    const an = (a.surcharge as { name?: string } | null)?.name ?? '';
    const bn = (b.surcharge as { name?: string } | null)?.name ?? '';
    return an.localeCompare(bn);
  });
});

async function confirmDeleteType() {
  const label = props.cabinetType.name.trim() || 'this cabinet type';
  const ok = await requestConfirm({
    title: 'Delete cabinet type?',
    message: `Delete "${label}"? All variants, prices, and surcharge links for this type will be removed. Depth option links to this type are cleared. This cannot be undone.`,
  });
  if (!ok) return;
  deleting.value = true;
  try {
    await deleteCabinetType(props.cabinetType.documentId);
    emit('refresh');
    toast.success('Cabinet type deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Could not delete cabinet type.'));
  } finally {
    deleting.value = false;
  }
}

async function confirmDeleteVariant(variant: CabinetVariant) {
  const ok = await requestConfirm({
    title: 'Delete variant?',
    message: `Delete variant "${variant.orderNumber}"? Its prices will be removed.`,
  });
  if (!ok) return;
  variantDeletingDocumentId.value = variant.documentId;
  try {
    await deleteCabinetVariant(variant.documentId);
    emit('refresh');
    toast.success('Variant deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Could not delete variant.'));
  } finally {
    variantDeletingDocumentId.value = null;
  }
}

function onLinkDepthOptions() {
  emit(
    'open-link-depth-options',
    props.cabinetType.documentId,
    sortedDepthOptions.value.map((d) => d.documentId),
    props.cabinetType.name,
  );
}

async function confirmUnlinkDepthOption(opt: DepthOption) {
  const ok = await requestConfirm({
    title: 'Remove depth option?',
    message: `Remove depth option "${opt.name}" from this cabinet type? The row stays in the library.`,
    confirmLabel: 'Remove',
  });
  if (!ok) return;
  depthUnlinkingDocumentId.value = opt.documentId;
  try {
    await updateDepthOption(opt.documentId, {
      disconnectCabinetTypeDocumentIds: [props.cabinetType.documentId],
    });
    emit('refresh');
    toast.success('Depth option removed from type.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Could not remove depth option.'));
  } finally {
    depthUnlinkingDocumentId.value = null;
  }
}

function onLinkSurcharge() {
  const linkedDocIds = sortedSurchargeLinks.value
    .map((l) => extractSurchargeDocumentId(l))
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '');
  emit('open-link-surcharge', {
    cabinetTypeId: props.cabinetType.id,
    cabinetTypeLabel: props.cabinetType.name,
    alreadyLinkedSurchargeDocumentIds: linkedDocIds,
    priceClasses: props.priceClasses,
  });
}

function onEditSurchargeLink(link: CabinetTypeSurchargeLink) {
  emit('open-edit-surcharge-link', {
    link,
    cabinetTypeLabel: props.cabinetType.name,
    priceClasses: props.priceClasses,
  });
}

async function confirmUnlinkSurcharge(link: CabinetTypeSurchargeLink) {
  const surcharge = link.surcharge;
  const label =
    surcharge && typeof surcharge === 'object' && 'name' in surcharge
      ? (surcharge as { name: string }).name
      : 'this surcharge';
  const ok = await requestConfirm({
    title: 'Remove surcharge link?',
    message: `Remove surcharge "${label}" from ${props.cabinetType.name}? Its per-class prices will be deleted.`,
  });
  if (!ok) return;
  surchargeLinkDeletingDocumentId.value = link.documentId;
  try {
    await deleteCabinetTypeSurchargeLink(link.documentId);
    emit('refresh');
    toast.success('Surcharge link removed.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Could not remove surcharge link.'));
  } finally {
    surchargeLinkDeletingDocumentId.value = null;
  }
}
</script>

<style scoped>
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
  width: 108px;
  height: 108px;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-sizing: border-box;
}

.catalog-type-block__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
</style>
