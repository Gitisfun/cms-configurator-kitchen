<template>
  <div class="catalog-page__header">
    <div class="catalog-page__header-main">
      <div class="catalog-page__title-row">
        <div v-if="imageSrc" class="catalog-page__series-thumb-wrap">
          <img :src="imageSrc" alt="" class="catalog-page__series-thumb" loading="lazy" width="56" height="56" />
        </div>
        <h1 class="catalog-page__title">{{ series.name }}</h1>
      </div>
      <p class="catalog-page__meta">
        <span
          >Carcase height
          <strong>{{ series.carcaseHeight != null ? `${series.carcaseHeight} mm` : '—' }}</strong></span
        >
        <span class="catalog-page__meta-sep">·</span>
        <span
          >Default depth
          <strong>{{ series.defaultCarcaseDepth != null ? `${series.defaultCarcaseDepth} mm` : '—' }}</strong></span
        >
        <template v-if="series.productLine">
          <span class="catalog-page__meta-sep">·</span>
          <span>{{ productLineLabel(series.productLine) }}</span>
        </template>
      </p>
      <p v-if="taxonomyLine" class="catalog-page__category">{{ taxonomyLine }}</p>
    </div>
    <div class="catalog-page__header-actions">
      <BaseButton type="button" variant="outlined" @click="$emit('edit')">
        <Icon name="lucide:pencil" class="base-btn__icon" />
        Edit series
      </BaseButton>
      <BaseButton type="button" variant="primary" @click="$emit('add-type')">
        <Icon name="lucide:plus" class="base-btn__icon" />
        Add cabinet type
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { extractPlinthImage } from '../../utils/plinthImage';
import { useStrapiPublicUrl } from '../../utils/strapiPublicUrl';
import type { CabinetSeries } from '../../services/cabinet-series';

const props = defineProps<{
  series: CabinetSeries;
  taxonomyLine: string;
}>();

const strapiPublicUrl = useStrapiPublicUrl();

const imageSrc = computed(() => extractPlinthImage(props.series, strapiPublicUrl.value).src);

defineEmits<{
  edit: [];
  'add-type': [];
}>();

function productLineLabel(pl: string | null): string {
  if (!pl) return '';
  const map: Record<string, string> = { standard: 'Standard', cLine: 'C-Line', xLine: 'X-Line' };
  return map[pl] ?? pl;
}
</script>

<style scoped>
.catalog-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
  padding: 1.25rem 1.25rem 1.25rem;
  background: var(--color-surface-card);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.catalog-page__title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.catalog-page__series-thumb-wrap {
  flex-shrink: 0;
}

.catalog-page__series-thumb {
  display: block;
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}

.catalog-page__title {
  margin: 0;
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
</style>
