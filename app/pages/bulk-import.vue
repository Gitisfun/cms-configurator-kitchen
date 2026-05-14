<template>
  <div>
    <CmsPageHeader
      title="Bulk import"
      :description="pageDescription"
    />

    <div class="bulk-import__card">
      <BulkSelector v-model="bulkImportTarget" />

      <div v-show="bulkImportTarget === 'cabinets' && extractedCabinetSections.length === 0" class="bulk-import__field bulk-import__field--series">
        <label for="bulk-import-series" class="bulk-import__label">Cabinet series</label>
        <div class="bulk-import__series-select-wrap">
          <BaseSelectCustom
            id="bulk-import-series"
            v-model="selectedSeriesDocumentId"
            :options="seriesSelectOptions"
            placeholder="Select a cabinet series…"
            :disabled="seriesPending || !!seriesError"
          />
        </div>
        <p v-if="seriesPending" class="bulk-import__series-meta">Loading series…</p>
        <p v-else-if="seriesError" class="bulk-import__series-meta bulk-import__series-meta--error">
          Could not load cabinet series.
          <button type="button" class="bulk-import__series-retry" @click="refreshSeries()">Retry</button>
        </p>
        <p v-else class="bulk-import__series-hint">Each import creates a new cabinet type in this series. Required for “Import to catalog” on each preview card.</p>
      </div>

      <div class="bulk-import__row bulk-import__row--actions-top">
        <label class="bulk-import__file-btn">
          <input type="file" accept=".json,application/json" class="bulk-import__file-input" @change="onFileSelected" />
          <Icon name="lucide:file-up" class="bulk-import__file-icon" />
          Choose JSON file
        </label>
        <label class="bulk-import__file-btn bulk-import__file-btn--pdf" :class="{ 'bulk-import__file-btn--disabled': pdfParsing }">
          <input
            type="file"
            accept=".pdf,application/pdf"
            class="bulk-import__file-input"
            :disabled="pdfParsing"
            @change="onPdfSelected"
          />
          <Icon :name="pdfParsing ? 'lucide:loader-circle' : 'lucide:file-text'" class="bulk-import__file-icon" :class="{ 'bulk-import__file-icon--spinning': pdfParsing }" />
          {{
            pdfParsing
              ? bulkImportTarget === 'fronts'
                ? 'Extracting fronts…'
                : bulkImportTarget === 'backs'
                  ? 'Extracting backs…'
                  : bulkImportTarget === 'plinths'
                    ? 'Extracting plinths…'
                    : bulkImportTarget === 'handles'
                      ? 'Extracting handles…'
                      : bulkImportTarget === 'worktops'
                        ? 'Extracting worktops…'
                        : 'Parsing PDF…'
              : 'Upload PDF'
          }}
        </label>
        <span v-if="loadedFileName" class="bulk-import__file-name">{{ loadedFileName }}</span>
      </div>

      <div v-if="pdfParsing" class="bulk-import__pdf-loading" role="status" aria-live="polite" aria-busy="true">
        <div class="bulk-import__pdf-loading-visual" aria-hidden="true">
          <svg class="bulk-import__pdf-svg" viewBox="0 0 88 104" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <defs>
              <linearGradient id="bulk-import-pdf-scan-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0" />
                <stop offset="45%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.55" />
                <stop offset="100%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0" />
              </linearGradient>
              <clipPath id="bulk-import-pdf-clip">
                <rect x="16" y="10" width="56" height="72" rx="6" />
              </clipPath>
            </defs>
            <g class="bulk-import__pdf-svg-doc">
              <rect class="bulk-import__pdf-svg-shadow" x="18" y="14" width="56" height="72" rx="6" fill="currentColor" opacity="0.06" />
              <rect
                class="bulk-import__pdf-svg-page"
                x="16"
                y="10"
                width="56"
                height="72"
                rx="6"
                stroke="currentColor"
                stroke-width="1.75"
                fill="var(--color-surface, #fff)"
              />
              <g stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" stroke-linecap="round">
                <line x1="24" y1="26" x2="64" y2="26" />
                <line x1="24" y1="36" x2="56" y2="36" />
                <line x1="24" y1="46" x2="62" y2="46" />
                <line x1="24" y1="56" x2="50" y2="56" />
              </g>
              <g clip-path="url(#bulk-import-pdf-clip)">
                <rect
                  class="bulk-import__pdf-svg-scan"
                  x="16"
                  y="14"
                  width="56"
                  height="16"
                  fill="url(#bulk-import-pdf-scan-grad)"
                />
              </g>
              <circle class="bulk-import__pdf-svg-orb" cx="58" cy="24" r="3.5" fill="var(--color-brand, #1b3a5c)" opacity="0.9" />
            </g>
          </svg>
        </div>
        <div class="bulk-import__pdf-loading-copy">
          <p class="bulk-import__pdf-loading-title">Processing your PDF</p>
          <p class="bulk-import__pdf-loading-sub">
            {{
              bulkImportTarget === 'fronts'
                ? 'The fronts extractor is reading the PDF and building JSON plus swatch images.'
                : bulkImportTarget === 'backs'
                  ? 'The backs extractor is reading the PDF and building JSON plus swatch images.'
                  : bulkImportTarget === 'plinths'
                    ? 'The plinths extractor is reading the PDF and building JSON plus swatch images.'
                    : bulkImportTarget === 'handles'
                      ? 'The handles extractor is reading the PDF and building JSON, handle-position diagrams, and swatch images.'
                      : bulkImportTarget === 'worktops'
                        ? 'The worktops extractor is reading the PDF and building JSON plus swatch images.'
                        : 'The extractor is reading the catalog and building JSON plus preview images.'
            }}
          </p>
        </div>
      </div>

      <div class="bulk-import__field bulk-import__field--json">
        <div class="bulk-import__json-toolbar">
          <label for="bulk-import-json" class="bulk-import__label">JSON</label>
          <button
            type="button"
            class="bulk-import__json-toggle"
            :aria-expanded="showJsonEditor"
            aria-controls="bulk-import-json"
            @click="showJsonEditor = !showJsonEditor"
          >
            <Icon :name="showJsonEditor ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="bulk-import__json-toggle-icon" />
            {{ showJsonEditor ? 'Hide' : 'Show' }} editor
          </button>
        </div>
        <p v-if="!showJsonEditor" class="bulk-import__json-collapsed-hint">
          Editor hidden — {{ jsonText.length.toLocaleString() }} character{{ jsonText.length === 1 ? '' : 's' }} still in memory. Click
          <span class="bulk-import__json-collapsed-hint-em">Show editor</span> to view or edit.
        </p>
        <textarea
          v-show="showJsonEditor"
          id="bulk-import-json"
          v-model="jsonText"
          class="bulk-import__textarea"
          spellcheck="false"
          autocomplete="off"
          rows="18"
          :placeholder="jsonPlaceholder"
          @input="onJsonInput"
        />
      </div>

      <p v-if="statusMessage" class="bulk-import__hint" :class="{ 'bulk-import__hint--error': statusIsError, 'bulk-import__hint--ok': statusIsOk }">
        {{ statusMessage }}
      </p>

      <ul v-if="validationErrors.length > 0" class="bulk-import__errors" aria-live="polite">
        <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
      </ul>

      <div v-show="bulkImportTarget === 'cabinets'" class="bulk-import__row bulk-import__row--footer">
        <BaseButton type="button" variant="outlined" :disabled="!jsonText.trim() || pdfParsing" @click="runValidate">
          <Icon name="lucide:check-circle" class="base-btn__icon" />
          Validate
        </BaseButton>
        <BaseButton type="button" :disabled="!jsonText.trim() || pdfParsing" @click="runImport">
          <Icon name="lucide:upload-cloud" class="base-btn__icon" />
          Import
        </BaseButton>
      </div>
    </div>

    <BulkSectionBack
      v-if="bulkImportTarget === 'backs' && extractedBacks.length > 0"
      v-model="extractedBacks"
    />

    <BulkSectionWorktop
      v-if="bulkImportTarget === 'worktops' && extractedWorktops.length > 0"
      v-model="extractedWorktops"
    />

    <BulkSectionPlinth
      v-if="bulkImportTarget === 'plinths' && extractedPlinths.length > 0"
      v-model="extractedPlinths"
    />

    <BulkSectionHandle
      v-if="bulkImportTarget === 'handles' && (extractedHandles.length > 0 || extractedHandlePositions.length > 0)"
      v-model:handles="extractedHandles"
      v-model:handle-positions="extractedHandlePositions"
    />

    <BulkSectionFront
      v-if="bulkImportTarget === 'fronts' && extractedFronts.length > 0"
      v-model="extractedFronts"
    />

    <BulkSectionCabinet
      v-if="bulkImportTarget === 'cabinets' && previewGroups && previewGroups.length > 0 && extractedCabinetSections.length === 0"
      :groups="previewGroups"
      :pdf-images="pdfExtractImages"
      :series-document-id="selectedSeriesDocumentId"
    />

    <section
      v-if="bulkImportTarget === 'cabinets' && extractedCabinetSections.length > 0"
      class="bulk-import__series-sections"
      aria-label="Extracted cabinet series"
    >
      <article v-for="section in extractedCabinetSections" :key="section.key" class="bulk-import__series-section">
        <header class="bulk-import__series-section-head">
          <div>
            <h2 class="bulk-import__series-section-title">{{ section.name }}</h2>
            <p class="bulk-import__series-section-meta">
              {{ cabinetSeriesMeta(section) }} · {{ section.groups.length }} product group{{ section.groups.length === 1 ? '' : 's' }}
            </p>
          </div>
          <div class="bulk-import__series-section-select">
            <label :for="`bulk-import-series-${section.key}`" class="bulk-import__label">Import into cabinet series</label>
            <BaseSelectCustom
              :id="`bulk-import-series-${section.key}`"
              v-model="sectionSeriesSelections[section.key]"
              :options="seriesSelectOptions"
              placeholder="Select a cabinet series…"
              :disabled="seriesPending || !!seriesError"
            />
            <button
              type="button"
              class="bulk-import__create-series-btn"
              :disabled="!!sectionCreateStates[section.key]?.saving"
              @click="openCreateForm(section)"
            >
              <Icon name="lucide:plus" class="bulk-import__create-series-btn-icon" aria-hidden="true" />
              Create new series
            </button>
          </div>
        </header>

        <div v-if="sectionCreateStates[section.key]?.open" class="bulk-import__create-series-form" role="form" :aria-label="`New cabinet series for ${section.name}`">
          <h3 class="bulk-import__create-series-form-title">New cabinet series</h3>
          <div class="bulk-import__create-series-fields">
            <div class="bulk-import__create-series-field bulk-import__create-series-field--wide">
              <label :for="`create-name-${section.key}`" class="bulk-import__label">Name <span aria-hidden="true">*</span></label>
              <input
                :id="`create-name-${section.key}`"
                v-model="sectionCreateStates[section.key].name"
                type="text"
                class="bulk-import__create-series-input"
                autocomplete="off"
                maxlength="255"
                :disabled="sectionCreateStates[section.key].saving"
                placeholder="e.g. Base units"
              />
            </div>
            <div class="bulk-import__create-series-field">
              <label :for="`create-height-${section.key}`" class="bulk-import__label">Carcase height (mm)</label>
              <input
                :id="`create-height-${section.key}`"
                v-model="sectionCreateStates[section.key].height"
                type="number"
                min="1"
                step="1"
                class="bulk-import__create-series-input"
                :disabled="sectionCreateStates[section.key].saving"
              />
            </div>
            <div class="bulk-import__create-series-field">
              <label :for="`create-depth-${section.key}`" class="bulk-import__label">Default depth (mm)</label>
              <input
                :id="`create-depth-${section.key}`"
                v-model="sectionCreateStates[section.key].depth"
                type="number"
                min="1"
                step="1"
                class="bulk-import__create-series-input"
                :disabled="sectionCreateStates[section.key].saving"
              />
            </div>
          </div>
          <p v-if="sectionCreateStates[section.key].error" class="bulk-import__create-series-error" role="alert">
            {{ sectionCreateStates[section.key].error }}
          </p>
          <div class="bulk-import__create-series-actions">
            <BaseButton
              type="button"
              variant="outlined"
              size="sm"
              :disabled="sectionCreateStates[section.key].saving"
              @click="closeCreateForm(section.key)"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              size="sm"
              :loading="sectionCreateStates[section.key].saving"
              :disabled="sectionCreateStates[section.key].saving || !sectionCreateStates[section.key].name.trim()"
              @click="submitCreateForm(section.key)"
            >
              <Icon name="lucide:plus" class="base-btn__icon" />
              Create series
            </BaseButton>
          </div>
        </div>

        <p v-else-if="!sectionSeriesSelections[section.key]" class="bulk-import__series-hint">
          No matching cabinet series was found automatically. Select one or create a new series before importing these cards.
        </p>
        <BulkSectionCabinet
          :groups="section.groups"
          :pdf-images="pdfExtractImages"
          :series-document-id="sectionSeriesSelections[section.key] || ''"
          :image-indexes="section.productIndexes"
          title="Preview"
          :description="`Review ${section.name} before sending these products to the selected cabinet series.`"
        />
      </article>
    </section>

  </div>
</template>

<script setup lang="ts">
import type { CatalogProductImport } from '~/types';
import type { BulkImportTarget } from '~/components/bulk/Selector.vue';
import type {
  ExtractedFrontRow,
  ExtractedBackRow,
  ExtractedWorktopRow,
  ExtractedPlinthRow,
  ExtractedHandleRow,
  ExtractedHandlePositionRow,
  CatalogPdfExtractedImage,
  ExtractedCabinetSeriesSection,
} from '~/types/bulk-import';
import {
  cabinetSeriesListPath,
  defaultCabinetSeriesResponse,
  createCabinetSeries,
  type CabinetSeries,
  type CabinetSeriesListResponse,
  type CabinetSeriesDocumentResponse,
} from '../services/cabinet-series';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { parseAndValidateCatalogImport } from '../utils/validateCatalogProductImport';

const SERIES_PAGE_SIZE = 500;

const bulkImportTarget = ref<BulkImportTarget>('cabinets');
const extractedFronts = ref<ExtractedFrontRow[]>([]);
const extractedBacks = ref<ExtractedBackRow[]>([]);
const extractedWorktops = ref<ExtractedWorktopRow[]>([]);
const extractedPlinths = ref<ExtractedPlinthRow[]>([]);
const extractedHandles = ref<ExtractedHandleRow[]>([]);
const extractedHandlePositions = ref<ExtractedHandlePositionRow[]>([]);

type CabinetPreviewSection = ExtractedCabinetSeriesSection & {
  key: string;
  groups: CatalogProductImport;
};

const extractedCabinetSections = ref<CabinetPreviewSection[]>([]);
const sectionSeriesSelections = ref<Record<string, string>>({});

type SectionCreateState = {
  open: boolean;
  saving: boolean;
  error: string;
  name: string;
  height: string;
  depth: string;
};
const sectionCreateStates = ref<Record<string, SectionCreateState>>({});

function openCreateForm(section: CabinetPreviewSection) {
  sectionCreateStates.value[section.key] = {
    open: true,
    saving: false,
    error: '',
    name: section.name ?? '',
    height: section.carcaseHeight != null ? String(section.carcaseHeight) : '',
    depth: section.defaultCarcaseDepth != null ? String(section.defaultCarcaseDepth) : '',
  };
}

function closeCreateForm(key: string) {
  const s = sectionCreateStates.value[key];
  if (s) s.open = false;
}

async function submitCreateForm(key: string) {
  const s = sectionCreateStates.value[key];
  if (!s || !s.name.trim()) return;
  s.saving = true;
  s.error = '';
  try {
    const body: Record<string, unknown> = { name: s.name.trim() };
    const h = parseInt(s.height, 10);
    const d = parseInt(s.depth, 10);
    if (!isNaN(h) && h > 0) body.carcaseHeight = h;
    if (!isNaN(d) && d > 0) body.defaultCarcaseDepth = d;
    const result = await createCabinetSeries(body) as CabinetSeriesDocumentResponse;
    const docId = result?.data?.documentId;
    await refreshSeries();
    if (docId) sectionSeriesSelections.value[key] = docId;
    s.open = false;
  } catch (err: unknown) {
    s.error = getFetchErrorMessage(err, 'Could not create cabinet series.');
  } finally {
    s.saving = false;
  }
}

const pageDescription = computed(() => {
  const t = bulkImportTarget.value;
  if (t === 'cabinets') return 'Paste catalog JSON, upload a supplier PDF to auto-fill JSON, validate, then import each product into a cabinet series (creates cabinet type, variants, prices, depth links, and surcharge links).';
  if (t === 'backs') return 'Upload a backs catalog PDF to extract backs (code, name, image) and JSON for review.';
  if (t === 'plinths') return 'Upload a plinths catalog PDF to extract plinths (code, name, description, image) and JSON for review.';
  if (t === 'handles') return 'Upload a handles catalog PDF — extracts position diagrams plus handle rows (type, subtype, code, surcharge, …) grouped for review.';
  if (t === 'worktops') return 'Upload a worktops catalog PDF to extract rows (image, code, note, name, description) and JSON for review.';
  return 'Upload a fronts catalog PDF to extract a list of fronts (code, name, image, price class) and JSON for review.';
});

const jsonPlaceholder = computed(() => {
  const t = bulkImportTarget.value;
  if (t === 'cabinets') return '[ { "name": "…", "image": "", "description": "…", "width": [ … ], "depthOptions": [], "surcharges": [] } ]';
  if (t === 'backs') return '[ { "code": "", "name": "", "image": "" } ] — filled automatically after PDF extract.';
  if (t === 'plinths') return '[ { "code": "", "name": "", "description": "", "image": "", "hasSurcharge": false } ] — filled automatically after PDF extract.';
  if (t === 'handles') return '{ "handles": [ … ], "handlePositions": [ … ] } — filled automatically after PDF extract.';
  if (t === 'worktops') return '[ { "image": "", "code": "", "note": "", "name": "", "description": "" } ] — filled automatically after PDF extract.';
  return '[ { "code": "", "name": "", "image": "", "priceClass": "" } ] — filled automatically after PDF extract.';
});

const { data: seriesData, pending: seriesPending, error: seriesError, refresh: refreshSeries } =
  useFetch<CabinetSeriesListResponse>(cabinetSeriesListPath, {
    key: 'bulk-import-cabinet-series',
    query: {
      'pagination[page]': 1,
      'pagination[pageSize]': SERIES_PAGE_SIZE,
    },
    default: () => defaultCabinetSeriesResponse(SERIES_PAGE_SIZE),
  });

const seriesRows = computed(() => {
  const rows = seriesData.value?.data ?? [];
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
});

const seriesSelectOptions = computed(() =>
  seriesRows.value.map((s) => ({
    value: s.documentId,
    label: seriesOptionLabel(s),
  })),
);

function formatNullableMm(value: number | null | undefined): string {
  return value != null ? `${value} mm` : 'unknown';
}

function cabinetSeriesMeta(series: { carcaseHeight: number | null; defaultCarcaseDepth: number | null }): string {
  return `height ${formatNullableMm(series.carcaseHeight)}, depth ${formatNullableMm(series.defaultCarcaseDepth)}`;
}

function seriesOptionLabel(series: CabinetSeries): string {
  return `${series.name} (${cabinetSeriesMeta(series)})`;
}

function normalizeSeriesName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findMatchingSeriesDocumentId(section: ExtractedCabinetSeriesSection): string {
  const sectionName = normalizeSeriesName(section.name);
  const match = seriesRows.value.find((series) =>
    normalizeSeriesName(series.name) === sectionName
    && series.carcaseHeight === section.carcaseHeight
    && series.defaultCarcaseDepth === section.defaultCarcaseDepth,
  );
  return match?.documentId ?? '';
}

function cabinetSectionKey(section: ExtractedCabinetSeriesSection, index: number): string {
  return [
    normalizeSeriesName(section.name).replace(/[^a-z0-9]+/g, '-'),
    section.carcaseHeight ?? 'height',
    section.defaultCarcaseDepth ?? 'depth',
    index,
  ].join('-');
}

function buildCabinetPreviewSections(data: CatalogProductImport, sections: ExtractedCabinetSeriesSection[]): CabinetPreviewSection[] {
  return sections
    .map((section, index) => {
      const productIndexes = [...new Set(section.productIndexes)]
        .filter((productIndex) => productIndex >= 0 && productIndex < data.length)
        .sort((a, b) => a - b);
      return {
        ...section,
        key: cabinetSectionKey(section, index),
        productIndexes,
        groups: productIndexes.map((productIndex) => data[productIndex]!),
      };
    })
    .filter((section) => section.groups.length > 0);
}

function initializeSectionSelections(sections: CabinetPreviewSection[]) {
  const next: Record<string, string> = {};
  for (const section of sections) {
    next[section.key] = sectionSeriesSelections.value[section.key] || findMatchingSeriesDocumentId(section);
  }
  sectionSeriesSelections.value = next;
}

watch(seriesRows, () => {
  if (extractedCabinetSections.value.length === 0) return;
  const next = { ...sectionSeriesSelections.value };
  let changed = false;
  for (const section of extractedCabinetSections.value) {
    if (next[section.key]) continue;
    const match = findMatchingSeriesDocumentId(section);
    if (!match) continue;
    next[section.key] = match;
    changed = true;
  }
  if (changed) sectionSeriesSelections.value = next;
});

const jsonText = ref('');
const showJsonEditor = ref(false);
const loadedFileName = ref<string | null>(null);
const pdfParsing = ref(false);
const pdfExtractImages = ref<CatalogPdfExtractedImage[]>([]);
const selectedSeriesDocumentId = ref('');

const statusMessage = ref('');
const statusIsError = ref(false);
const statusIsOk = ref(false);
const validationErrors = ref<string[]>([]);
const previewGroups = ref<CatalogProductImport | null>(null);

function clearStatus() {
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;
  validationErrors.value = [];
  previewGroups.value = null;
  extractedCabinetSections.value = [];
  sectionSeriesSelections.value = {};
}

function onJsonInput() {
  if (bulkImportTarget.value === 'cabinets') {
    clearStatus();
    return;
  }
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;
  validationErrors.value = [];
}

watch(extractedBacks, (rows) => {
  if (bulkImportTarget.value === 'backs') jsonText.value = rows.length ? JSON.stringify(rows, null, 2) : '';
});
watch(extractedWorktops, (rows) => {
  if (bulkImportTarget.value === 'worktops') jsonText.value = rows.length ? JSON.stringify(rows, null, 2) : '';
});
watch(extractedPlinths, (rows) => {
  if (bulkImportTarget.value === 'plinths') jsonText.value = rows.length ? JSON.stringify(rows, null, 2) : '';
});
watch(extractedFronts, (rows) => {
  if (bulkImportTarget.value === 'fronts') jsonText.value = rows.length ? JSON.stringify(rows, null, 2) : '';
});
watch([extractedHandles, extractedHandlePositions], () => {
  if (bulkImportTarget.value === 'handles') {
    jsonText.value = JSON.stringify(
      { handles: extractedHandles.value, handlePositions: extractedHandlePositions.value },
      null,
      2,
    );
  }
});

watch(bulkImportTarget, () => {
  extractedFronts.value = [];
  extractedBacks.value = [];
  extractedPlinths.value = [];
  extractedWorktops.value = [];
  extractedHandles.value = [];
  extractedHandlePositions.value = [];
  extractedCabinetSections.value = [];
  sectionSeriesSelections.value = {};
});

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  loadedFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : '';
    jsonText.value = text;
    showJsonEditor.value = false;
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedPlinths.value = [];
    extractedWorktops.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    clearStatus();
  };
  reader.onerror = () => {
    loadedFileName.value = null;
    statusMessage.value = 'Could not read the file.';
    statusIsError.value = true;
    statusIsOk.value = false;
  };
  reader.readAsText(file, 'UTF-8');
  input.value = '';
}

type ParsePdfOk = {
  ok: true;
  data: CatalogProductImport;
  series: ExtractedCabinetSeriesSection[];
  warnings: string[];
  images: CatalogPdfExtractedImage[];
};
type ExtractFrontsPdfOk = { ok: true; data: ExtractedFrontRow[]; warnings: string[] };
type ExtractBacksPdfOk = { ok: true; data: ExtractedBackRow[]; warnings: string[] };
type ExtractPlinthsPdfOk = { ok: true; data: ExtractedPlinthRow[]; warnings: string[] };
type ExtractHandlesPdfOk = {
  ok: true;
  data: { handles: ExtractedHandleRow[]; handlePositions: ExtractedHandlePositionRow[] };
  warnings: string[];
};
type ExtractWorktopsPdfOk = {
  ok: true;
  data: Array<{ image: string; code: string; note: string; name: string; description: string }>;
  warnings: string[];
};

function resetAllExtracted() {
  pdfExtractImages.value = [];
  extractedCabinetSections.value = [];
  sectionSeriesSelections.value = {};
  sectionCreateStates.value = {};
  extractedFronts.value = [];
  extractedBacks.value = [];
  extractedPlinths.value = [];
  extractedHandles.value = [];
  extractedHandlePositions.value = [];
  extractedWorktops.value = [];
}

type PdfErrorBody = {
  data?: { warnings?: string[]; errors?: string[] };
};

function collectPdfErrors(e: unknown, prefix: string): string[] {
  const fe = e as PdfErrorBody;
  const extra: string[] = [];
  if (Array.isArray(fe.data?.warnings) && fe.data!.warnings!.length) {
    extra.push(...fe.data!.warnings!.map((x) => `[${prefix}] ${x}`));
  }
  if (Array.isArray(fe.data?.errors) && fe.data!.errors!.length) {
    extra.push(...fe.data!.errors!);
  }
  return extra;
}

async function onPdfSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || pdfParsing.value) return;

  pdfParsing.value = true;
  clearStatus();
  resetAllExtracted();
  loadedFileName.value = file.name;

  const target = bulkImportTarget.value;

  try {
    const body = new FormData();
    body.append('file', file);

    if (target === 'handles') {
      const res = await $fetch<ExtractHandlesPdfOk>('\/api\/catalog-import\/extract-handles', { method: 'POST', body });
      extractedHandles.value = res.data.handles;
      extractedHandlePositions.value = res.data.handlePositions;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Handles] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      const nh = res.data.handles.length;
      const np = res.data.handlePositions.length;
      statusMessage.value = `Extracted ${nh} handle row${nh === 1 ? '' : 's'} and ${np} position diagram${np === 1 ? '' : 's'}${wNote}`;
      statusIsOk.value = true;
      return;
    }

    if (target === 'worktops') {
      const res = await $fetch<ExtractWorktopsPdfOk>('\/api\/catalog-import\/extract-worktops', { method: 'POST', body });
      extractedWorktops.value = res.data.map((r) => ({ ...r, price: '' }));
      jsonText.value = JSON.stringify(extractedWorktops.value, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Worktops] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} worktop row${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      return;
    }

    if (target === 'plinths') {
      const res = await $fetch<ExtractPlinthsPdfOk>('\/api\/catalog-import\/extract-plinths', { method: 'POST', body });
      extractedPlinths.value = res.data;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Plinths] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} plinth${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      return;
    }

    if (target === 'backs') {
      const res = await $fetch<ExtractBacksPdfOk>('\/api\/catalog-import\/extract-backs', { method: 'POST', body });
      extractedBacks.value = res.data;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Backs] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} back${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      return;
    }

    if (target === 'fronts') {
      const res = await $fetch<ExtractFrontsPdfOk>('\/api\/catalog-import\/extract-fronts', { method: 'POST', body });
      extractedFronts.value = res.data;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Fronts] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} front${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      return;
    }

    // Cabinets (default)
    const res = await $fetch<ParsePdfOk>('\/api\/catalog-import\/parse-pdf', { method: 'POST', body });
    jsonText.value = JSON.stringify(res.data, null, 2);
    previewGroups.value = res.data;
    extractedCabinetSections.value = buildCabinetPreviewSections(res.data, Array.isArray(res.series) ? res.series : []);
    initializeSectionSelections(extractedCabinetSections.value);
    showJsonEditor.value = false;
    const notice = res.warnings.length > 0
      ? ` Parsed with ${res.warnings.length} notice(s) — review the JSON and preview.`
      : ' Review the JSON and preview before importing.';
    validationErrors.value = res.warnings.length ? res.warnings.map((w) => `[PDF] ${w}`) : [];
    pdfExtractImages.value = Array.isArray(res.images) ? res.images : [];
    const seriesNote = extractedCabinetSections.value.length > 0
      ? ` across ${extractedCabinetSections.value.length} cabinet series`
      : '';
    statusMessage.value = `PDF converted: ${res.data.length} product group${res.data.length === 1 ? '' : 's'}${seriesNote}.${notice}`;
    statusIsOk.value = true;
  } catch (e: unknown) {
    loadedFileName.value = null;
    const prefixMap: Record<string, string> = {
      handles: 'Handles', worktops: 'Worktops', plinths: 'Plinths', backs: 'Backs', fronts: 'Fronts',
    };
    const prefix = prefixMap[target] ?? 'PDF';
    const defaultMsg = target === 'cabinets' ? 'Could not parse PDF.' : `Could not extract ${target} from PDF.`;
    statusMessage.value = getFetchErrorMessage(e, defaultMsg);
    validationErrors.value = collectPdfErrors(e, prefix);
    statusIsError.value = true;
    statusIsOk.value = false;
  } finally {
    pdfParsing.value = false;
  }
}

function runValidate() {
  if (bulkImportTarget.value !== 'cabinets') return;
  clearStatus();
  const result = parseAndValidateCatalogImport(jsonText.value);
  if (result.status === 'parse-error') {
    statusMessage.value = result.message;
    statusIsError.value = true;
    return;
  }
  if (result.status === 'invalid') {
    validationErrors.value = result.errors;
    statusMessage.value = `Validation failed (${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}).`;
    statusIsError.value = true;
    return;
  }
  statusMessage.value = `Valid: ${result.data.length} product group${result.data.length === 1 ? '' : 's'}.`;
  statusIsOk.value = true;
  previewGroups.value = result.data;
}

function runImport() {
  if (bulkImportTarget.value !== 'cabinets') return;
  clearStatus();
  const result = parseAndValidateCatalogImport(jsonText.value);
  if (result.status === 'parse-error') {
    statusMessage.value = result.message;
    statusIsError.value = true;
    return;
  }
  if (result.status === 'invalid') {
    validationErrors.value = result.errors;
    statusMessage.value = 'Fix validation errors before importing.';
    statusIsError.value = true;
    return;
  }
  console.log('[bulk-import] payload', result.data);
  statusMessage.value = `Ready: ${result.data.length} product group${result.data.length === 1 ? '' : 's'}. Use "Import to catalog" on each card (pick a series above).`;
  statusIsOk.value = true;
  previewGroups.value = result.data;
}
</script>

<style scoped>
.bulk-import__card {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
  max-width: 960px;
}

.bulk-import__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.bulk-import__field--json {
  gap: 0.4rem;
}

.bulk-import__json-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.bulk-import__json-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.bulk-import__json-toggle:hover {
  border-color: var(--color-brand);
  background: rgba(27, 58, 92, 0.05);
}

.bulk-import__json-toggle-icon {
  width: 16px;
  height: 16px;
  color: var(--color-brand);
}

.bulk-import__json-collapsed-hint {
  margin: 0 0 0.25rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  border: 1px dashed var(--color-border-subtle);
  background: var(--color-surface);
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: 1.45;
}

.bulk-import__json-collapsed-hint-em {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}


.bulk-import__field--series {
  margin-bottom: 1.25rem;
}

.bulk-import__series-select-wrap {
  width: 100%;
  max-width: 420px;
}

.bulk-import__series-hint,
.bulk-import__series-meta {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.bulk-import__series-meta--error {
  color: var(--color-danger, #b42318);
}

.bulk-import__series-retry {
  margin-left: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-brand);
  font-size: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  text-decoration: underline;
}

.bulk-import__series-retry:hover {
  color: var(--color-brand-secondary, var(--color-brand));
}

.bulk-import__series-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 960px;
}

.bulk-import__series-section {
  padding: var(--card-padding);
  border: var(--card-border);
  border-radius: var(--card-radius);
  background: var(--color-surface-card);
  box-shadow: var(--card-shadow);
}

.bulk-import__series-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.bulk-import__series-section-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  color: var(--color-text-primary);
}

.bulk-import__series-section-meta {
  margin: 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.bulk-import__series-section-select {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: min(100%, 420px);
}

.bulk-import__series-section :deep(.cabinet-preview) {
  margin-top: 1.25rem;
}

.bulk-import__create-series-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-brand);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.bulk-import__create-series-btn:hover {
  color: var(--color-brand-secondary, var(--color-brand));
}

.bulk-import__create-series-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.bulk-import__create-series-btn-icon {
  width: 13px;
  height: 13px;
}

.bulk-import__create-series-form {
  margin-top: 1rem;
  padding: 1rem 1.25rem 1.25rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-surface);
}

.bulk-import__create-series-form-title {
  margin: 0 0 1rem;
  font-size: var(--paragraph-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.bulk-import__create-series-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-bottom: 1rem;
}

.bulk-import__create-series-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 140px;
}

.bulk-import__create-series-field--wide {
  flex: 1 1 260px;
}

.bulk-import__create-series-input {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--input-radius, 8px);
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  box-sizing: border-box;
  width: 100%;
}

.bulk-import__create-series-input:focus {
  outline: 2px solid var(--color-brand);
  outline-offset: 1px;
  border-color: var(--color-brand);
}

.bulk-import__create-series-error {
  margin: 0 0 0.75rem;
  font-size: 12px;
  color: var(--color-danger, #b42318);
}

.bulk-import__create-series-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.bulk-import__label {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.bulk-import__textarea {
  width: 100%;
  min-height: 280px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--input-radius, 8px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-primary);
  background: var(--color-surface);
  resize: vertical;
  box-sizing: border-box;
}

.bulk-import__textarea:focus {
  outline: 2px solid var(--color-brand);
  outline-offset: 1px;
  border-color: var(--color-brand);
}

.bulk-import__textarea::placeholder {
  color: var(--color-text-muted);
}

.bulk-import__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.bulk-import__row--actions-top {
  margin-bottom: 1rem;
}

.bulk-import__row--footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.bulk-import__file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.bulk-import__file-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--button-padding-y) var(--button-padding-x);
  border: 1px solid var(--color-border-strong, var(--color-border-subtle));
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.bulk-import__file-btn:hover {
  border-color: var(--color-brand);
  background: rgba(27, 58, 92, 0.04);
}

.bulk-import__file-btn--pdf {
  border-style: dashed;
}

.bulk-import__file-btn--disabled {
  opacity: 0.65;
  pointer-events: none;
  cursor: not-allowed;
}

.bulk-import__file-icon {
  width: 18px;
  height: 18px;
  color: var(--color-brand);
}

.bulk-import__file-icon--spinning {
  animation: bulk-import-spin 0.9s linear infinite;
}

.bulk-import__file-name {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.bulk-import__pdf-loading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem 1.25rem;
  margin: 0 0 1rem;
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(27, 58, 92, 0.16);
  background: linear-gradient(135deg, rgba(27, 58, 92, 0.08) 0%, rgba(27, 58, 92, 0.03) 100%);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
}

.bulk-import__pdf-loading-visual {
  flex-shrink: 0;
  color: var(--color-brand);
  filter: drop-shadow(0 4px 10px rgba(27, 58, 92, 0.12));
}

.bulk-import__pdf-svg {
  display: block;
  width: 52px;
  height: auto;
  overflow: visible;
}

.bulk-import__pdf-svg-doc {
  transform-box: fill-box;
  transform-origin: center;
  animation: bulk-import-pdf-float 2.6s ease-in-out infinite;
}

.bulk-import__pdf-svg-page {
  animation: bulk-import-pdf-page-pulse 2.6s ease-in-out infinite;
}

.bulk-import__pdf-svg-scan {
  transform-box: fill-box;
  animation: bulk-import-pdf-scan 2.1s ease-in-out infinite;
  will-change: transform;
}

.bulk-import__pdf-svg-orb {
  transform-box: fill-box;
  transform-origin: center;
  animation: bulk-import-pdf-orb 1.4s ease-in-out infinite;
}

.bulk-import__pdf-loading-copy {
  min-width: 0;
  flex: 1;
}

.bulk-import__pdf-loading-title {
  margin: 0 0 0.2rem;
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  letter-spacing: 0.01em;
}

.bulk-import__pdf-loading-sub {
  margin: 0;
  font-size: var(--paragraph-size-small);
  line-height: 1.45;
  color: var(--color-text-muted);
  max-width: 40rem;
}

.bulk-import__hint {
  font-size: var(--paragraph-size-small);
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
}

.bulk-import__hint--error {
  color: var(--color-danger, #b42318);
}

.bulk-import__hint--ok {
  color: var(--color-success, #067647);
}

.bulk-import__errors {
  max-height: 200px;
  overflow-y: auto;
  margin: 0 0 0.5rem;
  padding: 0.75rem 1rem 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(180, 35, 24, 0.06);
  border: 1px solid rgba(180, 35, 24, 0.2);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.45;
  color: var(--color-text-primary);
}

.bulk-import__errors li + li {
  margin-top: 0.25rem;
}

/* ── Keyframe animations ──────────────────────────────────────────────── */

@keyframes bulk-import-spin {
  to { transform: rotate(360deg); }
}

@keyframes bulk-import-pdf-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-3px); }
}

@keyframes bulk-import-pdf-page-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.72; }
}

/*
 * The scan rect starts at y=14 in the SVG (viewBox "0 0 88 104").
 * The clipping region bottom is at y=82. The rect height is 16, so it needs
 * to travel 52 SVG units. At the rendered 52px wide / 88 unit viewBox scale
 * that is ≈ 30 CSS px, which is what translateY(30px) achieves.
 */
@keyframes bulk-import-pdf-scan {
  0%   { transform: translateY(0px);  opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 0.9; }
  100% { transform: translateY(30px); opacity: 0; }
}

@keyframes bulk-import-pdf-orb {
  0%, 100% { transform: scale(1);   opacity: 0.9; }
  50%       { transform: scale(1.5); opacity: 1;   }
}
</style>
