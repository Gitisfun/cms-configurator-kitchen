<template>
  <section class="cabinet-preview" aria-label="Import preview">
    <h2 class="cabinet-preview__title">{{ title }}</h2>
    <p class="cabinet-preview__desc">{{ description || `${groups.length} product group${groups.length === 1 ? '' : 's'} — review before sending to the API.` }}</p>

    <article v-for="(group, gi) in groups" :key="gi" class="cabinet-widget">
      <div class="cabinet-widget__layout">
        <div class="cabinet-widget__thumb">
          <template v-if="thumbs[gi]">
            <img :src="thumbs[gi]!.src" :alt="thumbs[gi]!.alt" class="cabinet-widget__thumb-img" loading="lazy" />
            <span class="cabinet-widget__thumb-cap">{{ thumbs[gi]!.caption }}</span>
          </template>
          <div v-else class="cabinet-widget__thumb-placeholder" role="img" aria-label="No product image">
            <Icon name="lucide:image-off" class="cabinet-widget__thumb-placeholder-icon" aria-hidden="true" />
            <span class="cabinet-widget__thumb-cap">No image</span>
          </div>
        </div>

        <div class="cabinet-widget__content">
          <header class="cabinet-widget__head">
            <div class="cabinet-widget__head-main">
              <span class="cabinet-widget__index">{{ gi + 1 }}</span>
              <div class="cabinet-widget__titles">
                <h3 class="cabinet-widget__name">{{ group.name.trim() || 'Untitled' }}</h3>
                <p v-if="group.image.trim()" class="cabinet-widget__meta">
                  <Icon name="lucide:image" class="cabinet-widget__meta-icon" />
                  {{ group.image }}
                </p>
              </div>
            </div>
            <BulkImportButton
              :imported="isImported(gi)"
              :importing="importingIndex === gi"
              :disabled="isImported(gi) || !canImport"
              size="sm"
              success-label="Success"
              @click="runImport(gi)"
            />
          </header>

          <p class="cabinet-widget__desc">{{ group.description }}</p>

          <div v-if="group.width.length" class="cabinet-block">
            <h4 class="cabinet-block__title">Width / order codes</h4>
            <div class="cabinet-table-wrap">
              <table class="cabinet-table">
                <thead>
                  <tr>
                    <th scope="col" rowspan="2">Width</th>
                    <th scope="col" rowspan="2">Code</th>
                    <th scope="col" rowspan="2">L/R</th>
                    <th scope="colgroup" colspan="9" class="cabinet-table__pg-banner">Price groups</th>
                  </tr>
                  <tr>
                    <th v-for="cls in PRICE_GROUP_COLS" :key="cls" scope="col" class="cabinet-table__pg-sub">{{ cls }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(w, wi) in group.width" :key="wi">
                    <td>{{ formatWidth(w) }}</td>
                    <td><code class="cabinet-code">{{ w.code }}</code></td>
                    <td>{{ w.LR ? 'Yes' : 'No' }}</td>
                    <td v-for="cls in PRICE_GROUP_COLS" :key="cls" class="cabinet-table__pg-col">{{ priceForClass(w.priceGroups, cls) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="group.depthOptions.length" class="cabinet-block">
            <h4 class="cabinet-block__title">Depth options</h4>
            <ul class="cabinet-chips">
              <li v-for="(d, di) in group.depthOptions" :key="di" class="cabinet-chip">
                <span class="cabinet-chip__value">{{ d.value }} mm</span>
                <span class="cabinet-chip__name">{{ d.name }}</span>
              </li>
            </ul>
          </div>

          <div v-if="group.surcharges.length" class="cabinet-block">
            <h4 class="cabinet-block__title">Surcharges</h4>
            <div class="cabinet-table-wrap">
              <table class="cabinet-table cabinet-table--surcharge">
                <thead>
                  <tr>
                    <th scope="col" rowspan="2">Name</th>
                    <th scope="col" rowspan="2">Code</th>
                    <th scope="colgroup" colspan="9" class="cabinet-table__pg-banner">Price groups</th>
                  </tr>
                  <tr>
                    <th v-for="cls in PRICE_GROUP_COLS" :key="cls" scope="col" class="cabinet-table__pg-sub">{{ cls }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, si) in group.surcharges" :key="si">
                    <td><span class="cabinet-surcharge-name">{{ s.name }}</span></td>
                    <td><code class="cabinet-code">{{ s.code }}</code></td>
                    <td v-for="cls in PRICE_GROUP_COLS" :key="cls" class="cabinet-table__pg-col">{{ priceForClass(s.priceGroups, cls) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>

  <BulkImportProgressModal
    :open="importingIndex !== null"
    :label="importingIndex != null ? `Cabinet ${importingIndex + 1} of ${groups.length}` : undefined"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CatalogProductGroup, CatalogPriceGroup, CatalogWidthEntry } from '~/types';
import type { CatalogPdfExtractedImage } from '~/types/bulk-import';
import { importCatalogProduct } from '~/services/catalog-import';
import { parseUploadResponseId, uploadMedia } from '~/services/upload';
import { getFetchErrorMessage } from '~/utils/fetchErrorMessage';

const props = withDefaults(defineProps<{
  groups: CatalogProductGroup[];
  pdfImages: CatalogPdfExtractedImage[];
  seriesDocumentId: string;
  imageIndexes?: number[];
  title?: string;
  description?: string;
}>(), {
  imageIndexes: undefined,
  title: 'Preview',
  description: '',
});

const toast = useToast();

const PRICE_GROUP_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

const importingIndex = ref<number | null>(null);
const importedIndexes = ref<Set<number>>(new Set());

const canImport = computed(() => props.seriesDocumentId.trim().length > 0 && importingIndex.value === null);

type Thumb = { src: string; alt: string; caption: string };

type EmbeddedImg = Extract<CatalogPdfExtractedImage, { source: 'embedded' }>;
type PageRenderImg = Extract<CatalogPdfExtractedImage, { source: 'page-render' }>;
type RowCropImg = Extract<CatalogPdfExtractedImage, { source: 'row-crop' }>;

function sourceImageIndex(gi: number): number {
  return props.imageIndexes?.[gi] ?? gi;
}

function resolvePdfThumb(gi: number, imgs: CatalogPdfExtractedImage[]): CatalogPdfExtractedImage | null {
  if (!imgs.length) return null;
  const sourceIndex = sourceImageIndex(gi);
  const rowCrops = imgs.filter((x): x is RowCropImg => x.source === 'row-crop');
  if (rowCrops.length > 0) {
    const byIndex = rowCrops.find((r) => r.groupIndex === sourceIndex);
    if (byIndex) return byIndex;
    const sorted = [...rowCrops].sort((a, b) => a.groupIndex - b.groupIndex);
    return sorted[sourceIndex] ?? sorted[sorted.length - 1] ?? null;
  }
  const embedded = imgs.filter((x): x is EmbeddedImg => x.source === 'embedded');
  const renders = imgs.filter((x): x is PageRenderImg => x.source === 'page-render');
  if (embedded.length > 0) return gi < embedded.length ? embedded[gi]! : embedded[embedded.length - 1]!;
  if (renders.length > 0) return renders.length === 1 ? renders[0]! : renders[Math.min(gi, renders.length - 1)]!;
  return null;
}

function pdfImgAlt(img: CatalogPdfExtractedImage): string {
  if (img.source === 'embedded') return `Page ${img.page}, embedded image ${img.index}`;
  if (img.source === 'row-crop') return `Page ${img.page}, row graphic preview`;
  return `Page ${img.page}, rendered preview`;
}

function pdfImgCaption(img: CatalogPdfExtractedImage): string {
  if (img.source === 'embedded') return `p.${img.page} · embedded #${img.index} · ${img.width}×${img.height}px`;
  if (img.source === 'row-crop') return `p.${img.page} · drawing · row ${img.groupIndex + 1}`;
  return `p.${img.page} · page render · ${img.scale}×`;
}

function groupThumb(group: CatalogProductGroup): Thumb | null {
  const s = group.image?.trim();
  if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) {
    return { src: s, alt: group.name.trim() || 'Product image', caption: 'From catalog JSON' };
  }
  return null;
}

const thumbs = computed<(Thumb | null)[]>(() => {
  if (!props.groups.length) return [];
  return props.groups.map((group, gi) => {
    const pdfImg = resolvePdfThumb(gi, props.pdfImages);
    if (pdfImg) return { src: pdfImg.dataUrl, alt: pdfImgAlt(pdfImg), caption: pdfImgCaption(pdfImg) };
    return groupThumb(group);
  });
});

function formatWidth(w: CatalogWidthEntry): string {
  if (w.value != null) return `${w.value} mm`;
  if (w.min != null && w.max != null) return `${w.min}–${w.max} mm`;
  if (w.min != null || w.max != null) return `${w.min ?? '…'}–${w.max ?? '…'} mm`;
  return '—';
}

function priceForClass(groups: CatalogPriceGroup[], cls: number): string {
  const row = groups.find((g) => g.class === cls);
  return row != null ? String(row.price) : '—';
}

function isImported(index: number): boolean {
  return importedIndexes.value.has(index);
}

function pdfImageFilename(img: CatalogPdfExtractedImage, gi: number): string {
  const ext = img.mimeType === 'image/svg+xml' ? 'svg' : 'png';
  if (img.source === 'embedded') return `catalog-p${img.page}-embedded-${img.index}.${ext}`;
  if (img.source === 'row-crop') return `catalog-p${img.page}-row-${img.groupIndex + 1}.${ext}`;
  return `catalog-p${img.page}-render-${gi + 1}.${ext}`;
}

async function uploadGroupImage(gi: number): Promise<number | undefined> {
  const pdfImg = resolvePdfThumb(gi, props.pdfImages);
  if (!pdfImg) return undefined;
  const imgRes = await fetch(pdfImg.dataUrl);
  if (!imgRes.ok) throw new Error('Could not prepare preview image for upload.');
  const blob = await imgRes.blob();
  const fd = new FormData();
  fd.append('file', blob, pdfImageFilename(pdfImg, gi));
  const raw = await uploadMedia(fd);
  const parsed = parseUploadResponseId(raw);
  if (!parsed?.id) throw new Error('Upload succeeded but no media id was returned.');
  return parsed.id;
}

async function runImport(gi: number) {
  const seriesId = props.seriesDocumentId.trim();
  if (!seriesId || !props.groups[gi] || isImported(gi)) return;

  importingIndex.value = gi;
  try {
    const product = props.groups[gi]!;
    const imageId = await uploadGroupImage(gi);
    const res = await importCatalogProduct({ cabinetSeriesDocumentId: seriesId, product, imageId });
    const imageNote = imageId ? ` image #${imageId} linked,` : '';
    toast.success(`Imported "${product.name.trim() || product.description.slice(0, 40)}…" — cabinet type ${res.cabinetType.documentId},${imageNote} ${res.variantCount} variant(s), ${res.cabinetPricesCreated} price row(s).`);
    importedIndexes.value = new Set(importedIndexes.value).add(gi);
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Import failed.'));
  } finally {
    importingIndex.value = null;
  }
}
</script>

<style scoped>
.cabinet-preview { margin-top: 2rem; max-width: 960px; }
.cabinet-preview__title { font-family: var(--font-serif); font-size: var(--header-size-small); font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.35rem; }
.cabinet-preview__desc { font-size: var(--paragraph-size-small); color: var(--color-text-muted); margin: 0 0 1.25rem; }

.cabinet-widget { background: var(--color-surface-card); border: var(--card-border); border-radius: var(--card-radius); box-shadow: var(--card-shadow); padding: var(--card-padding); margin-bottom: 1.25rem; }
.cabinet-widget:last-child { margin-bottom: 0; }
.cabinet-widget__layout { display: flex; flex-direction: row; align-items: flex-start; gap: 1rem; }
.cabinet-widget__thumb { flex: 0 0 auto; width: min(140px, 28vw); max-width: 160px; position: sticky; top: 0.75rem; }
.cabinet-widget__thumb-img { display: block; width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--color-border-subtle); background: #fff; object-fit: contain; }
.cabinet-widget__thumb-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem; width: 100%; min-height: 112px; aspect-ratio: 4 / 5; max-height: 200px; box-sizing: border-box; padding: 0.5rem; border-radius: 8px; border: 1px dashed var(--color-border-subtle); background: var(--color-surface); color: var(--color-text-muted); }
.cabinet-widget__thumb-placeholder-icon { width: 2rem; height: 2rem; flex-shrink: 0; opacity: 0.65; }
.cabinet-widget__thumb-cap { display: block; margin-top: 0.35rem; font-size: 10px; line-height: 1.3; color: var(--color-text-muted); font-variant-numeric: tabular-nums; word-break: break-word; }
.cabinet-widget__content { flex: 1; min-width: 0; }
.cabinet-widget__head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
.cabinet-widget__head-main { display: flex; align-items: flex-start; gap: 0.75rem; min-width: 0; flex: 1; }
.cabinet-widget__index { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; min-width: 1.75rem; height: 1.75rem; border-radius: 8px; font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-brand); background: rgba(27, 58, 92, 0.08); }
.cabinet-widget__titles { min-width: 0; }
.cabinet-widget__name { font-size: var(--paragraph-size); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; line-height: 1.35; }
.cabinet-widget__meta { display: flex; align-items: center; gap: 0.35rem; margin: 0.35rem 0 0; font-size: var(--paragraph-size-small); color: var(--color-text-muted); }
.cabinet-widget__meta-icon { width: 14px; height: 14px; flex-shrink: 0; }
.cabinet-widget__desc { font-size: var(--paragraph-size-small); color: var(--color-text-primary); line-height: 1.5; margin: 0 0 1rem; }

.cabinet-block { margin-top: 1rem; }
.cabinet-block__title { font-size: 12px; font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin: 0 0 0.5rem; }
.cabinet-table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid var(--color-border-subtle); }
.cabinet-table { width: 100%; border-collapse: collapse; font-size: var(--paragraph-size-small); }
.cabinet-table th, .cabinet-table td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--color-border-subtle); vertical-align: top; }
.cabinet-table th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); background: var(--color-surface); }
.cabinet-table tbody tr:last-child th, .cabinet-table tbody tr:last-child td { border-bottom: none; }
.cabinet-table__pg-banner { text-align: center; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; border-left: 1px solid var(--color-border-subtle); border-bottom: 1px solid var(--color-border-subtle); vertical-align: middle; }
.cabinet-table__pg-sub { text-align: right; font-size: 11px; font-weight: var(--font-weight-semibold); font-variant-numeric: tabular-nums; color: var(--color-text-muted); min-width: 2.75rem; }
.cabinet-table thead tr:nth-child(2) .cabinet-table__pg-sub:first-child { border-left: 1px solid var(--color-border-subtle); }
.cabinet-table__pg-col { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 12px; }
.cabinet-table:not(.cabinet-table--surcharge) tbody td:nth-child(4) { border-left: 1px solid var(--color-border-subtle); }
.cabinet-table--surcharge tbody td:nth-child(3) { border-left: 1px solid var(--color-border-subtle); }
.cabinet-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 0.1rem 0.35rem; border-radius: 4px; background: rgba(27, 58, 92, 0.06); color: var(--color-text-primary); }
.cabinet-chips { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.cabinet-chip { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--color-border-subtle); background: var(--color-surface); }
.cabinet-chip__value { font-weight: var(--font-weight-semibold); font-variant-numeric: tabular-nums; color: var(--color-text-primary); }
.cabinet-chip__name { font-size: 12px; color: var(--color-text-muted); }
.cabinet-surcharge-name { color: var(--color-text-primary); font-size: 12px; }

@media (max-width: 640px) {
  .cabinet-widget__layout { flex-direction: column; }
  .cabinet-widget__thumb { width: 100%; max-width: none; position: static; display: flex; flex-direction: column; align-items: center; }
  .cabinet-widget__thumb-img { max-width: 280px; }
  .cabinet-widget__thumb-placeholder { max-width: 280px; min-height: 120px; }
}
</style>
