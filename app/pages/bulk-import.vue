<template>
  <div>
    <CmsPageHeader
      title="Bulk import"
      :description="pageDescription"
    />

    <div class="bulk-import__card">
      <div class="bulk-import__field bulk-import__field--mode">
        <span id="bulk-import-mode-label" class="bulk-import__label">Import type</span>
        <div class="bulk-import__mode-toggle" role="group" aria-labelledby="bulk-import-mode-label">
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'cabinets' }"
            @click="bulkImportTarget = 'cabinets'"
          >
            <Icon name="lucide:boxes" class="bulk-import__mode-btn-icon" />
            Cabinets
          </button>
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'fronts' }"
            @click="bulkImportTarget = 'fronts'"
          >
            <Icon name="lucide:panel-top" class="bulk-import__mode-btn-icon" />
            Fronts
          </button>
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'backs' }"
            @click="bulkImportTarget = 'backs'"
          >
            <Icon name="lucide:panel-bottom" class="bulk-import__mode-btn-icon" />
            Backs
          </button>
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'plinths' }"
            @click="bulkImportTarget = 'plinths'"
          >
            <Icon name="lucide:stretch-horizontal" class="bulk-import__mode-btn-icon" />
            Plinths
          </button>
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'handles' }"
            @click="bulkImportTarget = 'handles'"
          >
            <Icon name="lucide:grip-horizontal" class="bulk-import__mode-btn-icon" />
            Handles
          </button>
          <button
            type="button"
            class="bulk-import__mode-btn"
            :class="{ 'bulk-import__mode-btn--active': bulkImportTarget === 'worktops' }"
            @click="bulkImportTarget = 'worktops'"
          >
            <Icon name="lucide:rectangle-horizontal" class="bulk-import__mode-btn-icon" />
            Worktops
          </button>
        </div>
        <p class="bulk-import__mode-hint">{{ modeHint }}</p>
      </div>

      <div v-show="bulkImportTarget === 'cabinets'" class="bulk-import__field bulk-import__field--series">
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

    <section
      v-if="bulkImportTarget === 'backs' && extractedBacks.length > 0"
      class="bulk-import__fronts-preview bulk-import__backs-preview"
      aria-label="Extracted backs"
    >
      <h2 class="bulk-import__preview-title">Backs</h2>
      <p class="bulk-import__preview-desc">
        {{ extractedBacks.length }} row{{ extractedBacks.length === 1 ? '' : 's' }} from the PDF extract. Click a card to edit code or name, or remove it from the list. Use Import to catalog to create backs in Strapi.
      </p>
      <div class="bulk-import__fronts-class-head">
        <h3 class="bulk-import__fronts-class-title">
          Preview <span class="bulk-import__fronts-class-count">{{ extractedBacks.length }}</span>
        </h3>
        <BaseButton
          type="button"
          size="sm"
          :variant="backsCatalogImported ? 'outlined' : 'primary'"
          :disabled="importingBacksBulk || backsCatalogImported"
          :loading="importingBacksBulk"
          :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': backsCatalogImported }]"
          @click="runBacksImportAll"
        >
          <Icon :name="backsCatalogImported ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
          {{ backsCatalogImported ? 'Imported' : 'Import to catalog' }}
        </BaseButton>
      </div>
      <ul class="bulk-import__fronts-grid">
        <li
          v-for="(row, bi) in extractedBacks"
          :key="`b-${bi}`"
          class="bulk-import__fronts-card"
          role="button"
          tabindex="0"
          :aria-label="`Edit back ${row.name.trim() || row.code || 'entry'}`"
          @click="openBackExtractEditor(bi)"
          @keydown.enter.prevent="openBackExtractEditor(bi)"
          @keydown.space.prevent="openBackExtractEditor(bi)"
        >
          <div class="bulk-import__fronts-card-media">
            <img
              v-if="row.image.trim()"
              :src="row.image"
              :alt="row.name.trim() || row.code"
              class="bulk-import__fronts-card-img"
              loading="lazy"
            />
            <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
              <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
            </div>
          </div>
          <div class="bulk-import__fronts-card-body">
            <code class="bulk-import__fronts-code">{{ row.code }}</code>
            <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section
      v-if="bulkImportTarget === 'worktops' && extractedWorktops.length > 0"
      class="bulk-import__fronts-preview bulk-import__worktops-preview"
      aria-label="Extracted worktops"
    >
      <h2 class="bulk-import__preview-title">Worktops</h2>
      <p class="bulk-import__preview-desc">
        {{ extractedWorktops.length }} row{{ extractedWorktops.length === 1 ? '' : 's' }} from the PDF extract. Click a card to edit fields (including optional surcharge price), or remove a row. Use Import to catalog to create worktops in Strapi.
      </p>
      <div class="bulk-import__fronts-class-head">
        <h3 class="bulk-import__fronts-class-title">
          Preview <span class="bulk-import__fronts-class-count">{{ extractedWorktops.length }}</span>
        </h3>
        <BaseButton
          type="button"
          size="sm"
          :variant="worktopsCatalogImported ? 'outlined' : 'primary'"
          :disabled="importingWorktopsBulk || worktopsCatalogImported"
          :loading="importingWorktopsBulk"
          :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': worktopsCatalogImported }]"
          @click="runWorktopsImportAll"
        >
          <Icon :name="worktopsCatalogImported ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
          {{ worktopsCatalogImported ? 'Imported' : 'Import to catalog' }}
        </BaseButton>
      </div>
      <ul class="bulk-import__fronts-grid">
        <li
          v-for="(row, wi) in extractedWorktops"
          :key="`wt-${wi}`"
          class="bulk-import__fronts-card"
          role="button"
          tabindex="0"
          :aria-label="`Edit worktop ${row.name.trim() || row.code || 'entry'}`"
          @click="openWorktopExtractEditor(wi)"
          @keydown.enter.prevent="openWorktopExtractEditor(wi)"
          @keydown.space.prevent="openWorktopExtractEditor(wi)"
        >
          <div class="bulk-import__fronts-card-media">
            <img
              v-if="row.image.trim()"
              :src="row.image"
              :alt="row.name.trim() || row.code"
              class="bulk-import__fronts-card-img"
              loading="lazy"
            />
            <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
              <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
            </div>
          </div>
          <div class="bulk-import__fronts-card-body">
            <code class="bulk-import__fronts-code">{{ row.code }}</code>
            <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
            <p v-if="row.note.trim()" class="bulk-import__handles-card-meta">{{ row.note }}</p>
            <p v-if="row.price.trim()" class="bulk-import__handles-card-meta">{{ row.price }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section
      v-if="bulkImportTarget === 'plinths' && extractedPlinths.length > 0"
      class="bulk-import__fronts-preview bulk-import__plinths-preview"
      aria-label="Extracted plinths"
    >
      <h2 class="bulk-import__preview-title">Plinths</h2>
      <p class="bulk-import__preview-desc">
        {{ extractedPlinths.length }} row{{ extractedPlinths.length === 1 ? '' : 's' }} from the PDF extract — standard plinths and surcharge rows are listed separately. Click a card to edit fields or remove it from the list. Import each section to Strapi when ready (description is folded into the catalog name when Strapi has no separate field).
      </p>

      <div v-if="plinthBasicEntries.length > 0" class="bulk-import__fronts-class-block bulk-import__plinths-section">
        <div class="bulk-import__fronts-class-head">
          <h3 class="bulk-import__fronts-class-title">
            Standard plinths
            <span class="bulk-import__fronts-class-count">{{ plinthBasicEntries.length }}</span>
          </h3>
          <BaseButton
            type="button"
            size="sm"
            :variant="plinthsBasicImported ? 'outlined' : 'primary'"
            :disabled="importingPlinthsBasicBulk || plinthsBasicImported || importingPlinthsSurchargeBulk"
            :loading="importingPlinthsBasicBulk"
            :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': plinthsBasicImported }]"
            @click="runPlinthsImportSection(false)"
          >
            <Icon :name="plinthsBasicImported ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
            {{ plinthsBasicImported ? 'Imported' : 'Import to catalog' }}
          </BaseButton>
        </div>
        <ul class="bulk-import__fronts-grid">
          <li
            v-for="{ row, index } in plinthBasicEntries"
            :key="`p-b-${index}`"
            class="bulk-import__fronts-card"
            role="button"
            tabindex="0"
            :aria-label="`Edit plinth ${row.name.trim() || row.code || 'entry'}`"
            @click="openPlinthExtractEditor(index)"
            @keydown.enter.prevent="openPlinthExtractEditor(index)"
            @keydown.space.prevent="openPlinthExtractEditor(index)"
          >
            <div class="bulk-import__fronts-card-media">
              <img
                v-if="row.image.trim()"
                :src="row.image"
                :alt="row.name.trim() || row.code"
                class="bulk-import__fronts-card-img"
                loading="lazy"
              />
              <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
                <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
              </div>
            </div>
            <div class="bulk-import__fronts-card-body">
              <code class="bulk-import__fronts-code">{{ row.code }}</code>
              <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
              <p v-if="row.description.trim()" class="bulk-import__plinth-card-desc">{{ row.description }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="plinthSurchargeEntries.length > 0" class="bulk-import__fronts-class-block bulk-import__plinths-section">
        <div class="bulk-import__fronts-class-head">
          <h3 class="bulk-import__fronts-class-title">
            Plinth surcharges
            <span class="bulk-import__fronts-class-count">{{ plinthSurchargeEntries.length }}</span>
          </h3>
          <BaseButton
            type="button"
            size="sm"
            :variant="plinthsSurchargeImported ? 'outlined' : 'primary'"
            :disabled="importingPlinthsSurchargeBulk || plinthsSurchargeImported || importingPlinthsBasicBulk"
            :loading="importingPlinthsSurchargeBulk"
            :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': plinthsSurchargeImported }]"
            @click="runPlinthsImportSection(true)"
          >
            <Icon :name="plinthsSurchargeImported ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
            {{ plinthsSurchargeImported ? 'Imported' : 'Import to catalog' }}
          </BaseButton>
        </div>
        <ul class="bulk-import__fronts-grid">
          <li
            v-for="{ row, index } in plinthSurchargeEntries"
            :key="`p-s-${index}`"
            class="bulk-import__fronts-card"
            role="button"
            tabindex="0"
            :aria-label="`Edit plinth surcharge ${row.name.trim() || row.code || 'entry'}`"
            @click="openPlinthExtractEditor(index)"
            @keydown.enter.prevent="openPlinthExtractEditor(index)"
            @keydown.space.prevent="openPlinthExtractEditor(index)"
          >
            <div class="bulk-import__fronts-card-media">
              <img
                v-if="row.image.trim()"
                :src="row.image"
                :alt="row.name.trim() || row.code"
                class="bulk-import__fronts-card-img"
                loading="lazy"
              />
              <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
                <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
              </div>
            </div>
            <div class="bulk-import__fronts-card-body">
              <code class="bulk-import__fronts-code">{{ row.code }}</code>
              <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
              <p v-if="row.description.trim()" class="bulk-import__plinth-card-desc">{{ row.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="bulkImportTarget === 'handles' && handlesExtractSectionVisible"
      class="bulk-import__fronts-preview bulk-import__handles-preview"
      aria-label="Extracted handles"
    >
      <h2 class="bulk-import__preview-title">Handles</h2>
      <p class="bulk-import__preview-desc">
        Import position diagrams into the Strapi Handle positions collection first (labels A, B, C…). Then use Import to catalog on each product group below to create Handles; “A / B / C” links to positions when names match.
      </p>

      <div v-if="extractedHandlePositions.length > 0" class="bulk-import__fronts-class-block bulk-import__handles-positions-block">
        <div class="bulk-import__fronts-class-head">
          <h3 class="bulk-import__fronts-class-title">
            Handle positions (Strapi table)
            <span class="bulk-import__fronts-class-count">{{ extractedHandlePositions.length }}</span>
          </h3>
          <BaseButton
            type="button"
            size="sm"
            :variant="importedHandlePositionsCatalog ? 'outlined' : 'primary'"
            :disabled="importingHandlePositionsCatalog || importedHandlePositionsCatalog"
            :loading="importingHandlePositionsCatalog"
            :class="[
              'bulk-import__fronts-class-import-btn',
              { 'bulk-import__fronts-class-import-btn--success': importedHandlePositionsCatalog },
            ]"
            @click="runHandlePositionsCatalogImport"
          >
            <Icon :name="importedHandlePositionsCatalog ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
            {{ importedHandlePositionsCatalog ? 'Imported' : 'Import to catalog' }}
          </BaseButton>
        </div>
        <p class="bulk-import__handles-positions-meta">
          Diagrams for the handle-position reference table (not product handles). Rows that already exist in Strapi by name are skipped.
        </p>
        <ul class="bulk-import__fronts-grid">
          <li
            v-for="(hp, hpi) in extractedHandlePositions"
            :key="`hp-${hpi}`"
            class="bulk-import__fronts-card bulk-import__handles-position-card"
          >
            <div class="bulk-import__fronts-card-media">
              <img
                v-if="hp.image.trim()"
                :src="hp.image"
                :alt="hp.name.trim() || 'Position'"
                class="bulk-import__fronts-card-img"
                loading="lazy"
              />
              <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
                <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
              </div>
            </div>
            <div class="bulk-import__fronts-card-body">
              <p class="bulk-import__handles-position-label">{{ hp.name.trim() || '—' }}</p>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="handlePositionsForHandlesError" class="bulk-import__hint bulk-import__hint--error">{{ handlePositionsForHandlesError }}</p>
      <p v-else-if="handlePositionsForHandlesPending" class="bulk-import__hint">Loading Strapi handle positions for import…</p>

      <div v-for="[groupKey, rows] in handlesByTypeAndSubtype" :key="groupKey" class="bulk-import__fronts-class-block">
        <div class="bulk-import__fronts-class-head">
          <h3 class="bulk-import__fronts-class-title bulk-import__handles-group-title">
            <span class="bulk-import__handles-group-type">{{ splitHandleGroupKey(groupKey).type }}</span>
            <span class="bulk-import__handles-group-sep">·</span>
            <span class="bulk-import__handles-group-subtype">{{ splitHandleGroupKey(groupKey).subtype }}</span>
            <span class="bulk-import__fronts-class-count">{{ rows.length }}</span>
          </h3>
          <BaseButton
            type="button"
            size="sm"
            :variant="isHandlesGroupImported(groupKey) ? 'outlined' : 'primary'"
            :disabled="
              !canRunHandlesGroupImport ||
              handlePositionsForHandlesPending ||
              !!handlePositionsForHandlesError ||
              isHandlesGroupImported(groupKey) ||
              importingHandlesGroupKey === groupKey
            "
            :loading="importingHandlesGroupKey === groupKey"
            :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': isHandlesGroupImported(groupKey) }]"
            @click="runHandlesImportForGroup(groupKey)"
          >
            <Icon :name="isHandlesGroupImported(groupKey) ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
            {{ isHandlesGroupImported(groupKey) ? 'Imported' : 'Import to catalog' }}
          </BaseButton>
        </div>
        <ul class="bulk-import__fronts-grid">
          <li
            v-for="(row, ri) in rows"
            :key="`han-${globalHandleIndex(groupKey, ri)}`"
            class="bulk-import__fronts-card"
            role="button"
            tabindex="0"
            :aria-label="`Edit handle ${row.name.trim() || row.code || 'entry'}`"
            @click="openHandleExtractEditor(globalHandleIndex(groupKey, ri))"
            @keydown.enter.prevent="openHandleExtractEditor(globalHandleIndex(groupKey, ri))"
            @keydown.space.prevent="openHandleExtractEditor(globalHandleIndex(groupKey, ri))"
          >
            <div class="bulk-import__fronts-card-media">
              <img
                v-if="row.image.trim()"
                :src="row.image"
                :alt="row.name.trim() || row.code"
                class="bulk-import__fronts-card-img"
                loading="lazy"
              />
              <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
                <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
              </div>
            </div>
            <div class="bulk-import__fronts-card-body">
              <code class="bulk-import__fronts-code">{{ row.code }}</code>
              <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
              <p v-if="row.handlePostions.trim()" class="bulk-import__handles-card-meta">{{ row.handlePostions }}</p>
              <p v-if="row.height.trim()" class="bulk-import__handles-card-meta">{{ row.height }}</p>
              <p v-if="row.surcharge.trim()" class="bulk-import__handles-card-meta">{{ row.surcharge }}</p>
              <p v-if="row.description.trim()" class="bulk-import__plinth-card-desc">{{ row.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="bulkImportTarget === 'fronts' && extractedFronts.length > 0"
      class="bulk-import__fronts-preview"
      aria-label="Extracted fronts by price class"
    >
      <h2 class="bulk-import__preview-title">Fronts</h2>
      <p class="bulk-import__preview-desc">
        {{ extractedFronts.length }} row{{ extractedFronts.length === 1 ? '' : 's' }} grouped by price class. Click a swatch card to edit fields or remove it from the list.
      </p>
      <p v-if="priceClassesForFrontsError" class="bulk-import__hint bulk-import__hint--error">{{ priceClassesForFrontsError }}</p>
      <p v-else-if="priceClassesForFrontsPending" class="bulk-import__hint">Loading Strapi price classes for import…</p>

      <div v-for="[priceClass, rows] in frontsByPriceClass" :key="priceClass" class="bulk-import__fronts-class-block">
        <div class="bulk-import__fronts-class-head">
          <h3 class="bulk-import__fronts-class-title">
            Price class <span class="bulk-import__fronts-class-badge">{{ priceClass }}</span>
            <span class="bulk-import__fronts-class-count">{{ rows.length }}</span>
          </h3>
          <BaseButton
            type="button"
            size="sm"
            :variant="isFrontsPriceClassImported(priceClass) ? 'outlined' : 'primary'"
            :disabled="
              !canRunFrontsClassImport ||
              priceClassesForFrontsPending ||
              !!priceClassesForFrontsError ||
              strapiPriceClassIdForLevel(priceClass) == null ||
              isFrontsPriceClassImported(priceClass)
            "
            :loading="importingFrontsPriceClass === priceClass"
            :class="['bulk-import__fronts-class-import-btn', { 'bulk-import__fronts-class-import-btn--success': isFrontsPriceClassImported(priceClass) }]"
            :title="
              strapiPriceClassIdForLevel(priceClass) == null
                ? 'No Strapi price class uses this level number.'
                : undefined
            "
            @click="runFrontsImportForPriceClass(priceClass, rows)"
          >
            <Icon :name="isFrontsPriceClassImported(priceClass) ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
            {{ isFrontsPriceClassImported(priceClass) ? 'Imported' : 'Import to catalog' }}
          </BaseButton>
        </div>
        <ul class="bulk-import__fronts-grid">
          <li
            v-for="(row, ri) in rows"
            :key="`f-${globalIndexForFrontRow(priceClass, ri)}`"
            class="bulk-import__fronts-card"
            role="button"
            tabindex="0"
            :aria-label="`Edit front ${row.name.trim() || row.code || 'entry'}`"
            @click="openFrontExtractEditor(globalIndexForFrontRow(priceClass, ri))"
            @keydown.enter.prevent="openFrontExtractEditor(globalIndexForFrontRow(priceClass, ri))"
            @keydown.space.prevent="openFrontExtractEditor(globalIndexForFrontRow(priceClass, ri))"
          >
            <div class="bulk-import__fronts-card-media">
              <img
                v-if="row.image.trim()"
                :src="row.image"
                :alt="row.name.trim() || row.code"
                class="bulk-import__fronts-card-img"
                loading="lazy"
              />
              <div v-else class="bulk-import__fronts-card-img bulk-import__fronts-card-img--empty" role="img" aria-label="No image">
                <Icon name="lucide:image-off" class="bulk-import__fronts-card-img-icon" />
              </div>
            </div>
            <div class="bulk-import__fronts-card-body">
              <code class="bulk-import__fronts-code">{{ row.code }}</code>
              <p class="bulk-import__fronts-name">{{ row.name.trim() || '—' }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <BaseModal v-model="frontExtractEditorOpen" title-id="bulk-import-front-extract-title" title="Edit front (preview)" size="medium">
      <form id="bulk-import-front-extract-form" class="bulk-import__front-edit-form" @submit.prevent="saveFrontExtractEditor">
        <div v-if="frontExtractFormImage.trim()" class="bulk-import__front-edit-thumb-wrap">
          <img :src="frontExtractFormImage" alt="" class="bulk-import__front-edit-thumb" />
        </div>
        <BaseInputField v-model="frontExtractFormCode" label="Code" type="text" name="frontCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="frontExtractFormName" label="Name" type="text" name="frontName" autocomplete="off" maxlength="255" spaced />
        <BaseInputField
          v-model="frontExtractFormPriceClass"
          label="Price class (level)"
          type="text"
          name="frontPriceClass"
          autocomplete="off"
          maxlength="32"
          spaced
        />
        <p class="bulk-import__front-edit-hint">Image comes from the PDF extract and cannot be changed here. Delete this row and re-upload the PDF if the swatch is wrong.</p>
      </form>
      <template #footer>
        <div class="bulk-import__front-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteFrontExtractRow"> Delete </BaseButton>
          <span class="bulk-import__front-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="closeFrontExtractEditor"> Cancel </BaseButton>
          <BaseButton type="submit" form="bulk-import-front-extract-form" variant="primary"> Save </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="backExtractEditorOpen" title-id="bulk-import-back-extract-title" title="Edit back (preview)" size="medium">
      <form id="bulk-import-back-extract-form" class="bulk-import__front-edit-form" @submit.prevent="saveBackExtractEditor">
        <div v-if="backExtractFormImage.trim()" class="bulk-import__front-edit-thumb-wrap">
          <img :src="backExtractFormImage" alt="" class="bulk-import__front-edit-thumb" />
        </div>
        <BaseInputField v-model="backExtractFormCode" label="Code" type="text" name="backCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="backExtractFormName" label="Name" type="text" name="backName" autocomplete="off" maxlength="255" spaced />
        <p class="bulk-import__front-edit-hint">Image comes from the PDF extract and cannot be changed here. Delete this row and re-upload the PDF if the swatch is wrong.</p>
      </form>
      <template #footer>
        <div class="bulk-import__front-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteBackExtractRow"> Delete </BaseButton>
          <span class="bulk-import__front-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="closeBackExtractEditor"> Cancel </BaseButton>
          <BaseButton type="submit" form="bulk-import-back-extract-form" variant="primary"> Save </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="worktopExtractEditorOpen" title-id="bulk-import-worktop-extract-title" title="Edit worktop (preview)" size="medium">
      <form id="bulk-import-worktop-extract-form" class="bulk-import__front-edit-form" @submit.prevent="saveWorktopExtractEditor">
        <div v-if="worktopExtractFormImage.trim()" class="bulk-import__front-edit-thumb-wrap">
          <img :src="worktopExtractFormImage" alt="" class="bulk-import__front-edit-thumb" />
        </div>
        <BaseInputField v-model="worktopExtractFormCode" label="Code" type="text" name="worktopCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="worktopExtractFormName" label="Name" type="text" name="worktopName" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="worktopExtractFormNote" label="Note" type="text" name="worktopNote" autocomplete="off" maxlength="2000" spaced />
        <BaseInputField
          v-model="worktopExtractFormDescription"
          label="Description"
          type="text"
          name="worktopDescription"
          autocomplete="off"
          maxlength="2000"
          spaced
        />
        <BaseInputField
          v-model="worktopExtractFormPrice"
          label="Price (surcharge)"
          type="text"
          name="worktopPrice"
          inputmode="decimal"
          placeholder="Optional — e.g. 9,00 €"
          maxlength="64"
          spaced
        />
        <p class="bulk-import__front-edit-hint">Image comes from the PDF extract and cannot be changed here.</p>
      </form>
      <template #footer>
        <div class="bulk-import__front-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteWorktopExtractRow"> Delete </BaseButton>
          <span class="bulk-import__front-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="closeWorktopExtractEditor"> Cancel </BaseButton>
          <BaseButton type="submit" form="bulk-import-worktop-extract-form" variant="primary"> Save </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="plinthExtractEditorOpen" title-id="bulk-import-plinth-extract-title" title="Edit plinth (preview)" size="medium">
      <form id="bulk-import-plinth-extract-form" class="bulk-import__front-edit-form" @submit.prevent="savePlinthExtractEditor">
        <div v-if="plinthExtractFormImage.trim()" class="bulk-import__front-edit-thumb-wrap">
          <img :src="plinthExtractFormImage" alt="" class="bulk-import__front-edit-thumb" />
        </div>
        <BaseInputField v-model="plinthExtractFormCode" label="Code" type="text" name="plinthCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="plinthExtractFormName" label="Name" type="text" name="plinthName" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="plinthExtractFormDescription" label="Description" type="text" name="plinthDescription" autocomplete="off" maxlength="500" spaced />
        <label class="bulk-import__plinth-surcharge-field">
          <input v-model="plinthExtractFormHasSurcharge" type="checkbox" class="bulk-import__plinth-surcharge-checkbox" />
          <span>Surcharge row (from surcharge pages in the PDF)</span>
        </label>
        <p class="bulk-import__front-edit-hint">Image comes from the PDF extract and cannot be changed here. Delete this row and re-upload the PDF if the swatch is wrong.</p>
      </form>
      <template #footer>
        <div class="bulk-import__front-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deletePlinthExtractRow"> Delete </BaseButton>
          <span class="bulk-import__front-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="closePlinthExtractEditor"> Cancel </BaseButton>
          <BaseButton type="submit" form="bulk-import-plinth-extract-form" variant="primary"> Save </BaseButton>
        </div>
      </template>
    </BaseModal>

    <BaseModal v-model="handleExtractEditorOpen" title-id="bulk-import-handle-extract-title" title="Edit handle (preview)" size="medium">
      <form id="bulk-import-handle-extract-form" class="bulk-import__front-edit-form" @submit.prevent="saveHandleExtractEditor">
        <div v-if="handleExtractFormImage.trim()" class="bulk-import__front-edit-thumb-wrap">
          <img :src="handleExtractFormImage" alt="" class="bulk-import__front-edit-thumb" />
        </div>
        <BaseInputField v-model="handleExtractFormCode" label="Code" type="text" name="handleCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="handleExtractFormName" label="Name" type="text" name="handleName" autocomplete="off" maxlength="255" spaced />
        <BaseInputField
          v-model="handleExtractFormHandlePositions"
          label="Handle positions (extract)"
          type="text"
          name="handlePositionsField"
          autocomplete="off"
          maxlength="255"
          spaced
        />
        <BaseInputField v-model="handleExtractFormHeight" label="Height" type="text" name="handleHeight" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="handleExtractFormSurcharge" label="Surcharge" type="text" name="handleSurcharge" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="handleExtractFormType" label="Type" type="text" name="handleType" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="handleExtractFormSubtype" label="Subtype" type="text" name="handleSubtype" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="handleExtractFormDescription" label="Description" type="text" name="handleDescription" autocomplete="off" maxlength="500" spaced />
        <p class="bulk-import__front-edit-hint">Image comes from the PDF extract and cannot be changed here.</p>
      </form>
      <template #footer>
        <div class="bulk-import__front-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteHandleExtractRow"> Delete </BaseButton>
          <span class="bulk-import__front-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="closeHandleExtractEditor"> Cancel </BaseButton>
          <BaseButton type="submit" form="bulk-import-handle-extract-form" variant="primary"> Save </BaseButton>
        </div>
      </template>
    </BaseModal>

    <section v-if="bulkImportTarget === 'cabinets' && previewGroups && previewGroups.length > 0" class="bulk-import__preview" aria-label="Import preview">
      <h2 class="bulk-import__preview-title">Preview</h2>
      <p class="bulk-import__preview-desc">{{ previewGroups.length }} product group{{ previewGroups.length === 1 ? '' : 's' }} — review before sending to the API.</p>

      <article v-for="(group, gi) in previewGroups" :key="gi" class="bulk-import__widget">
        <div class="bulk-import__widget-layout">
          <div class="bulk-import__widget-thumb">
            <template v-if="previewCardThumbs[gi]">
              <img
                :src="previewCardThumbs[gi]!.src"
                :alt="previewCardThumbs[gi]!.alt"
                class="bulk-import__widget-thumb-img"
                loading="lazy"
              />
              <span class="bulk-import__widget-thumb-cap">{{ previewCardThumbs[gi]!.caption }}</span>
            </template>
            <div v-else class="bulk-import__widget-thumb-placeholder" role="img" aria-label="No product image">
              <Icon name="lucide:image-off" class="bulk-import__widget-thumb-placeholder-icon" aria-hidden="true" />
              <span class="bulk-import__widget-thumb-cap">No image</span>
            </div>
          </div>
          <div class="bulk-import__widget-content">
            <header class="bulk-import__widget-head">
              <div class="bulk-import__widget-head-main">
                <span class="bulk-import__widget-index">{{ gi + 1 }}</span>
                <div class="bulk-import__widget-titles">
                  <h3 class="bulk-import__widget-name">{{ group.name.trim() || 'Untitled' }}</h3>
                  <p v-if="group.image.trim()" class="bulk-import__widget-meta">
                    <Icon name="lucide:image" class="bulk-import__widget-meta-icon" />
                    {{ group.image }}
                  </p>
                </div>
              </div>
              <BaseButton
                type="button"
                :variant="isGroupImported(gi) ? 'outlined' : 'primary'"
                size="sm"
                :disabled="isGroupImported(gi) || !canRunCatalogImport"
                :loading="importingGroupIndex === gi"
                :class="['bulk-import__widget-import-btn', { 'bulk-import__widget-import-btn--success': isGroupImported(gi) }]"
                @click="runCatalogImportForGroup(gi)"
              >
                <Icon :name="isGroupImported(gi) ? 'lucide:check-circle' : 'lucide:database'" class="base-btn__icon" />
                {{ isGroupImported(gi) ? 'Success' : 'Import to catalog' }}
              </BaseButton>
            </header>

            <p class="bulk-import__widget-desc">{{ group.description }}</p>

            <div v-if="group.width.length" class="bulk-import__block">
          <h4 class="bulk-import__block-title">Width / order codes</h4>
          <div class="bulk-import__table-wrap">
            <table class="bulk-import__table">
              <thead>
                <tr>
                  <th scope="col" rowspan="2">Width</th>
                  <th scope="col" rowspan="2">Code</th>
                  <th scope="col" rowspan="2">L/R</th>
                  <th scope="colgroup" colspan="9" class="bulk-import__th-pg-banner">Price groups</th>
                </tr>
                <tr>
                  <th
                    v-for="cls in priceGroupColumnClasses"
                    :key="cls"
                    scope="col"
                    class="bulk-import__th-pg-sub"
                  >
                    {{ cls }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, wi) in group.width" :key="wi">
                  <td>{{ formatWidthMm(w) }}</td>
                  <td>
                    <code class="bulk-import__code">{{ w.code }}</code>
                  </td>
                  <td>{{ w.LR ? 'Yes' : 'No' }}</td>
                  <td
                    v-for="cls in priceGroupColumnClasses"
                    :key="cls"
                    class="bulk-import__pg-col"
                  >
                    {{ priceForClass(w.priceGroups, cls) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="group.depthOptions.length" class="bulk-import__block">
          <h4 class="bulk-import__block-title">Depth options</h4>
          <ul class="bulk-import__chips">
            <li v-for="(d, di) in group.depthOptions" :key="di" class="bulk-import__chip">
              <span class="bulk-import__chip-value">{{ d.value }} mm</span>
              <span class="bulk-import__chip-name">{{ d.name }}</span>
            </li>
          </ul>
        </div>

        <div v-if="group.surcharges.length" class="bulk-import__block">
          <h4 class="bulk-import__block-title">Surcharges</h4>
          <div class="bulk-import__table-wrap">
            <table class="bulk-import__table bulk-import__table--surcharge">
              <thead>
                <tr>
                  <th scope="col" rowspan="2">Name</th>
                  <th scope="col" rowspan="2">Code</th>
                  <th scope="colgroup" colspan="9" class="bulk-import__th-pg-banner">Price groups</th>
                </tr>
                <tr>
                  <th
                    v-for="cls in priceGroupColumnClasses"
                    :key="cls"
                    scope="col"
                    class="bulk-import__th-pg-sub"
                  >
                    {{ cls }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, si) in group.surcharges" :key="si">
                  <td>
                    <span class="bulk-import__surcharge-name">{{ s.name }}</span>
                  </td>
                  <td>
                    <code class="bulk-import__code">{{ s.code }}</code>
                  </td>
                  <td
                    v-for="cls in priceGroupColumnClasses"
                    :key="cls"
                    class="bulk-import__pg-col"
                  >
                    {{ priceForClass(s.priceGroups, cls) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type {
  CatalogProductImport,
  CatalogProductGroup,
  CatalogPriceGroup,
  CatalogWidthEntry,
} from '~/types';
import {
  cabinetSeriesListPath,
  defaultCabinetSeriesResponse,
  type CabinetSeriesListResponse,
} from '../services/cabinet-series';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { importCatalogProduct } from '../services/catalog-import';
import { createBack } from '../services/backs';
import { createWorktop } from '../services/worktops';
import { createFront } from '../services/fronts';
import { createPlinth } from '../services/plinths';
import { createHandle } from '../services/handles';
import {
  createHandlePosition,
  fetchAllHandlePositions,
  type HandlePosition,
} from '../services/handle-positions';
import { getPriceClassesSortedByLevel, type PriceClass } from '../services/price-classes';
import { parseUploadResponseId, uploadMedia } from '../services/upload';
import { parseAndValidateCatalogImport } from '../utils/validateCatalogProductImport';

const SERIES_PAGE_SIZE = 500;

/** Catalog price sheet columns 0–8 (matches typical “Price groups” header). */
const priceGroupColumnClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

type ExtractedFrontRow = {
  code: string;
  name: string;
  image: string;
  priceClass: string;
};

type ExtractedBackRow = {
  code: string;
  name: string;
  image: string;
};

type ExtractedWorktopRow = {
  image: string;
  code: string;
  note: string;
  name: string;
  description: string;
  /** Optional surcharge for Strapi price; set in preview editor. */
  price: string;
};

type ExtractedPlinthRow = {
  code: string;
  name: string;
  image: string;
  description: string;
  /** From extractor: standard catalog vs surcharge chapter (`hasSurcharge` in JSON). */
  hasSurcharge: boolean;
};

/** Matches extractor typo `handlePostions` in handles.json / ZIP. */
type ExtractedHandleRow = {
  image: string;
  code: string;
  name: string;
  handlePostions: string;
  height: string;
  surcharge: string;
  type: string;
  subtype: string;
  description: string;
};

type ExtractedHandlePositionRow = {
  name: string;
  image: string;
};

type HandlesExtractPayload = {
  handles: ExtractedHandleRow[];
  handlePositions: ExtractedHandlePositionRow[];
};

const HANDLE_GROUP_SEP = '\u0000';

const bulkImportTarget = ref<'cabinets' | 'fronts' | 'backs' | 'plinths' | 'handles' | 'worktops'>('cabinets');
const extractedFronts = ref<ExtractedFrontRow[]>([]);
const extractedBacks = ref<ExtractedBackRow[]>([]);
const extractedWorktops = ref<ExtractedWorktopRow[]>([]);
const extractedPlinths = ref<ExtractedPlinthRow[]>([]);
const importingBacksBulk = ref(false);
const backsCatalogImported = ref(false);
const importingWorktopsBulk = ref(false);
const worktopsCatalogImported = ref(false);
const importingPlinthsBasicBulk = ref(false);
const importingPlinthsSurchargeBulk = ref(false);
const plinthsBasicImported = ref(false);
const plinthsSurchargeImported = ref(false);
const extractedHandles = ref<ExtractedHandleRow[]>([]);
const extractedHandlePositions = ref<ExtractedHandlePositionRow[]>([]);
const handlePositionsStrapi = ref<HandlePosition[]>([]);
const handlePositionsForHandlesPending = ref(false);
const handlePositionsForHandlesError = ref('');
const importingHandlesGroupKey = ref<string | null>(null);
const importedHandleGroupKeys = ref<Set<string>>(new Set());
const importingHandlePositionsCatalog = ref(false);
const importedHandlePositionsCatalog = ref(false);
const priceClassesForFronts = ref<PriceClass[]>([]);
const priceClassesForFrontsPending = ref(false);
const priceClassesForFrontsError = ref('');
const importingFrontsPriceClass = ref<string | null>(null);
const importedFrontsPriceClasses = ref<Set<string>>(new Set());

const { requestConfirm } = useConfirmDialog();
const toast = useToast();

const canRunFrontsClassImport = computed(() => importingFrontsPriceClass.value === null);

const pageDescription = computed(() => {
  const t = bulkImportTarget.value;
  if (t === 'cabinets') {
    return 'Paste catalog JSON, upload a supplier PDF to auto-fill JSON, validate, then import each product into a cabinet series (creates cabinet type, variants, prices, depth links, and surcharge links).';
  }
  if (t === 'backs') {
    return 'Upload a backs catalog PDF to extract backs (code, name, image) and JSON for review.';
  }
  if (t === 'plinths') {
    return 'Upload a plinths catalog PDF to extract plinths (code, name, description, image) and JSON for review.';
  }
  if (t === 'handles') {
    return 'Upload a handles catalog PDF — extracts position diagrams plus handle rows (type, subtype, code, surcharge, …) grouped for review.';
  }
  if (t === 'worktops') {
    return 'Upload a worktops catalog PDF to extract rows (image, code, note, name, description) and JSON for review.';
  }
  return 'Upload a fronts catalog PDF to extract a list of fronts (code, name, image, price class) and JSON for review.';
});

const modeHint = computed(() => {
  const t = bulkImportTarget.value;
  if (t === 'cabinets') {
    return 'PDF upload fills cabinet catalog JSON and preview images. Use Validate / Import for Strapi.';
  }
  if (t === 'backs') {
    return 'PDF upload fills the grid and JSON. Click a card to edit code or name, or delete a preview row. Use Import to catalog to send previews to Strapi.';
  }
  if (t === 'plinths') {
    return 'PDF upload fills the grid and JSON. Click a card to edit fields or delete a preview row. Use Import to catalog to send previews to Strapi.';
  }
  if (t === 'handles') {
    return 'Positions appear first; handles are grouped by type and subtype. Import each group to Strapi; editing JSON or cards resets import flags.';
  }
  if (t === 'worktops') {
    return 'PDF upload fills the grid and JSON. Click a card to edit fields or optional surcharge price, or delete a preview row. Use Import to catalog to send previews to Strapi.';
  }
  return 'PDF upload fills the grid and JSON. Click a card to edit or delete a preview row. Use Import to catalog on each price class for Strapi (levels 0–8 must exist as price classes).';
});

const jsonPlaceholder = computed(() => {
  const t = bulkImportTarget.value;
  if (t === 'cabinets') {
    return '[ { "name": "…", "image": "", "description": "…", "width": [ … ], "depthOptions": [], "surcharges": [] } ]';
  }
  if (t === 'backs') {
    return '[ { "code": "", "name": "", "image": "" } ] — filled automatically after PDF extract.';
  }
  if (t === 'plinths') {
    return '[ { "code": "", "name": "", "description": "", "image": "", "hasSurcharge": false } ] — filled automatically after PDF extract.';
  }
  if (t === 'handles') {
    return '{ "handles": [ … ], "handlePositions": [ … ] } — filled automatically after PDF extract.';
  }
  if (t === 'worktops') {
    return '[ { "image": "", "code": "", "note": "", "name": "", "description": "" } ] — filled automatically after PDF extract.';
  }
  return '[ { "code": "", "name": "", "image": "", "priceClass": "" } ] — filled automatically after PDF extract.';
});

const frontsByPriceClass = computed(() => {
  const map = new Map<string, ExtractedFrontRow[]>();
  for (const row of extractedFronts.value) {
    const k = row.priceClass.trim() || '—';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(row);
  }
  return [...map.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }),
  );
});

function plinthRowIsSurcharge(row: ExtractedPlinthRow): boolean {
  return row.hasSurcharge === true;
}

/** Original indices into `extractedPlinths` for stable editing keys. */
const plinthBasicEntries = computed(() =>
  extractedPlinths.value
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !plinthRowIsSurcharge(row)),
);

const plinthSurchargeEntries = computed(() =>
  extractedPlinths.value
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => plinthRowIsSurcharge(row)),
);

const handlesExtractSectionVisible = computed(
  () => extractedHandlePositions.value.length > 0 || extractedHandles.value.length > 0,
);

function handleGroupKey(type: string, subtype: string): string {
  return `${type}${HANDLE_GROUP_SEP}${subtype}`;
}

function splitHandleGroupKey(key: string): { type: string; subtype: string } {
  const i = key.indexOf(HANDLE_GROUP_SEP);
  if (i === -1) return { type: key || '—', subtype: '—' };
  return {
    type: key.slice(0, i) || '—',
    subtype: key.slice(i + HANDLE_GROUP_SEP.length) || '—',
  };
}

const handlesByTypeAndSubtype = computed(() => {
  const map = new Map<string, ExtractedHandleRow[]>();
  for (const row of extractedHandles.value) {
    const k = handleGroupKey(row.type.trim() || '—', row.subtype.trim() || '—');
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(row);
  }
  return [...map.entries()].sort((a, b) => {
    const ca = splitHandleGroupKey(a[0]);
    const cb = splitHandleGroupKey(b[0]);
    const cmp = ca.type.localeCompare(cb.type, undefined, { sensitivity: 'base' });
    return cmp !== 0 ? cmp : ca.subtype.localeCompare(cb.subtype, undefined, { sensitivity: 'base' });
  });
});

function globalHandleIndex(groupKey: string, rowIndexInGroup: number): number {
  let offset = 0;
  for (const [k, rows] of handlesByTypeAndSubtype.value) {
    if (k === groupKey) return offset + rowIndexInGroup;
    offset += rows.length;
  }
  return -1;
}

const canRunHandlesGroupImport = computed(() => importingHandlesGroupKey.value === null);

function isHandlesGroupImported(groupKey: string): boolean {
  return importedHandleGroupKeys.value.has(groupKey);
}

async function reloadHandlePositionsStrapi() {
  handlePositionsForHandlesPending.value = true;
  handlePositionsForHandlesError.value = '';
  try {
    handlePositionsStrapi.value = await fetchAllHandlePositions();
  } catch {
    handlePositionsStrapi.value = [];
    handlePositionsForHandlesError.value =
      'Could not load handle positions. Imports match position labels (e.g. A) to Strapi by name.';
  } finally {
    handlePositionsForHandlesPending.value = false;
  }
}

function handlePositionNameDedupeKey(name: string): string {
  return name.trim().toLowerCase();
}

async function ensureHandlePositionsForHandlesImport() {
  if (handlePositionsStrapi.value.length > 0 || handlePositionsForHandlesPending.value) return;
  await reloadHandlePositionsStrapi();
}

watch(
  () => [bulkImportTarget.value, extractedHandles.value.length] as const,
  async ([target, n]) => {
    if (target === 'handles' && n > 0) {
      await ensureHandlePositionsForHandlesImport();
    }
  },
  { immediate: true },
);

async function ensurePriceClassesForFrontsImport() {
  if (priceClassesForFronts.value.length > 0 || priceClassesForFrontsPending.value) return;
  priceClassesForFrontsPending.value = true;
  priceClassesForFrontsError.value = '';
  try {
    const res = await getPriceClassesSortedByLevel(200);
    priceClassesForFronts.value = res.data;
  } catch {
    priceClassesForFrontsError.value =
      'Could not load price classes. Import needs Strapi price classes whose level matches the PDF band (0–8).';
  } finally {
    priceClassesForFrontsPending.value = false;
  }
}

watch(
  () => [bulkImportTarget.value, extractedFronts.value.length] as const,
  async ([target, n]) => {
    if (target === 'fronts' && n > 0) {
      await ensurePriceClassesForFrontsImport();
    }
  },
  { immediate: true },
);

function parsePriceClassLevel(levelKey: string): number | null {
  const t = levelKey.trim();
  if (t === '—' || !t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function strapiPriceClassIdForLevel(levelKey: string): number | null {
  const level = parsePriceClassLevel(levelKey);
  if (level == null) return null;
  const pc = priceClassesForFronts.value.find((p) => p.level === level);
  return pc?.id ?? null;
}

function isFrontsPriceClassImported(levelKey: string): boolean {
  return importedFrontsPriceClasses.value.has(levelKey);
}

function safeSwatchBasename(prefix: string, code: string, rowIndex: number): string {
  const t = code.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return t || `${prefix}-${rowIndex}`;
}

async function uploadSwatchImageFromDataUrl(imageSrc: string, basename: string): Promise<number | undefined> {
  const src = imageSrc?.trim();
  if (!src || !src.startsWith('data:')) return undefined;
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error('Could not read swatch image for upload.');
  }
  const blob = await res.blob();
  const fd = new FormData();
  fd.append('file', blob, `${basename}.png`);
  const uploadRaw = await uploadMedia(fd);
  const parsed = parseUploadResponseId(uploadRaw);
  if (!parsed?.id) {
    throw new Error('Upload succeeded but no media id was returned.');
  }
  return parsed.id;
}

async function uploadFrontRowImage(row: ExtractedFrontRow, rowIndex: number): Promise<number | undefined> {
  return uploadSwatchImageFromDataUrl(row.image ?? '', safeSwatchBasename('front', row.code, rowIndex));
}

function plinthStrapiName(row: ExtractedPlinthRow, index: number): string {
  const base = row.name.trim() || row.code.trim();
  const desc = row.description.trim();
  let name = base || `Plinth ${index + 1}`;
  if (desc) {
    const suffix = ` — ${desc}`;
    const max = 255;
    const combined = name + suffix;
    name = combined.length <= max ? combined : combined.slice(0, max);
  }
  return name;
}

async function runBacksImportAll() {
  if (importingBacksBulk.value || backsCatalogImported.value) return;
  const rows = extractedBacks.value;
  if (!rows.length) return;

  importingBacksBulk.value = true;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  let ok = 0;
  try {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      const name = row.name.trim() || row.code.trim() || `Back ${i + 1}`;
      const imageId = await uploadSwatchImageFromDataUrl(row.image ?? '', safeSwatchBasename('back', row.code, i));
      const body: Record<string, unknown> = { name };
      if (row.code.trim()) body.code = row.code.trim();
      if (imageId != null) body.imageId = imageId;
      await createBack(body);
      ok += 1;
    }
    backsCatalogImported.value = true;
    statusMessage.value = `Imported ${ok} back${ok === 1 ? '' : 's'} to the catalog.`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(
      e,
      ok > 0 ? `Import stopped after ${ok} of ${rows.length} backs.` : 'Back import failed.',
    );
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    importingBacksBulk.value = false;
  }
}

async function runWorktopsImportAll() {
  if (importingWorktopsBulk.value || worktopsCatalogImported.value) return;
  const rows = extractedWorktops.value;
  if (!rows.length) return;

  importingWorktopsBulk.value = true;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  let ok = 0;
  try {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      const name = row.name.trim() || row.code.trim() || `Worktop ${i + 1}`;
      const imageId = await uploadSwatchImageFromDataUrl(row.image ?? '', safeSwatchBasename('worktop', row.code, i));
      const body: Record<string, unknown> = { name };
      if (row.code.trim()) body.code = row.code.trim();
      if (row.note.trim()) body.note = row.note.trim();
      if (row.description.trim()) body.description = row.description.trim();
      const price = parseEuropeanSurchargePrice(row.price);
      if (price != null) body.price = price;
      if (imageId != null) body.imageId = imageId;
      await createWorktop(body);
      ok += 1;
    }
    worktopsCatalogImported.value = true;
    statusMessage.value = `Imported ${ok} worktop${ok === 1 ? '' : 's'} to the catalog.`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(
      e,
      ok > 0 ? `Import stopped after ${ok} of ${rows.length} worktops.` : 'Worktop import failed.',
    );
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    importingWorktopsBulk.value = false;
  }
}

async function runPlinthsImportSection(isSurchargeSection: boolean) {
  const loadingRef = isSurchargeSection ? importingPlinthsSurchargeBulk : importingPlinthsBasicBulk;
  const doneRef = isSurchargeSection ? plinthsSurchargeImported : plinthsBasicImported;
  const otherLoadingRef = isSurchargeSection ? importingPlinthsBasicBulk : importingPlinthsSurchargeBulk;

  if (loadingRef.value || doneRef.value || otherLoadingRef.value) return;

  const indices = extractedPlinths.value
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => plinthRowIsSurcharge(row) === isSurchargeSection)
    .map(({ i }) => i);

  if (!indices.length) return;

  loadingRef.value = true;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  const sectionLabel = isSurchargeSection ? 'surcharge' : 'standard';
  let ok = 0;
  try {
    for (const i of indices) {
      const row = extractedPlinths.value[i]!;
      const name = plinthStrapiName(row, i);
      const imageId = await uploadSwatchImageFromDataUrl(row.image ?? '', safeSwatchBasename('plinth', row.code, i));
      const body: Record<string, unknown> = { name };
      if (row.code.trim()) body.code = row.code.trim();
      if (imageId != null) body.imageId = imageId;
      await createPlinth(body);
      ok += 1;
    }
    doneRef.value = true;
    statusMessage.value = `Imported ${ok} plinth${ok === 1 ? '' : 's'} (${sectionLabel} section).`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(
      e,
      ok > 0
        ? `Import stopped after ${ok} of ${indices.length} plinths (${sectionLabel} section).`
        : `Plinth import failed (${sectionLabel} section).`,
    );
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    loadingRef.value = false;
  }
}

function parseEuropeanSurchargePrice(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const digits = t.replace(/[^\d,.-]/g, '');
  if (!digits) return undefined;
  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');
  let s = digits;
  if (lastComma > lastDot) {
    s = digits.replace(/\./g, '').replace(',', '.');
  } else {
    s = digits.replace(/,/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function resolveHandlePositionDocumentIdsFromExtract(positionsStr: string): string[] {
  const tokens = positionsStr
    .split(/[/|]/)
    .map((x) => x.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const token of tokens) {
    const key = handlePositionNameDedupeKey(token);
    const hp = handlePositionsStrapi.value.find((p) => handlePositionNameDedupeKey(p.name) === key);
    if (hp?.documentId) out.push(hp.documentId);
  }
  return [...new Set(out)];
}

function handleCatalogNameForStrapi(row: ExtractedHandleRow): string {
  let n = row.name.trim() || row.code.trim() || 'Handle';
  if (row.code.trim() && !n.includes(row.code.trim())) {
    n = `${n} (${row.code.trim()})`;
  }
  const desc = row.description.trim();
  if (desc) {
    const suffix = ` — ${desc}`;
    const combined = n + suffix;
    n = combined.length <= 255 ? combined : combined.slice(0, 255);
  }
  return n;
}

function syncHandlesJsonPayloadText() {
  const payload: HandlesExtractPayload = {
    handles: extractedHandles.value,
    handlePositions: extractedHandlePositions.value,
  };
  jsonText.value = JSON.stringify(payload, null, 2);
}

async function runHandlePositionsCatalogImport() {
  if (importingHandlePositionsCatalog.value || importedHandlePositionsCatalog.value) return;
  const rows = extractedHandlePositions.value;
  if (!rows.length) return;

  importingHandlePositionsCatalog.value = true;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  let created = 0;
  let skippedExistingStrapi = 0;
  let skippedDuplicateInExtract = 0;
  let emptyNames = 0;

  try {
    await reloadHandlePositionsStrapi();
    if (handlePositionsForHandlesError.value) {
      statusMessage.value = handlePositionsForHandlesError.value;
      statusIsError.value = true;
      toast.danger(statusMessage.value);
      return;
    }

    const strapiNameKeysLower = new Set(
      handlePositionsStrapi.value.map((p) => handlePositionNameDedupeKey(p.name)),
    );
    const seenNameKeysLower = new Set(strapiNameKeysLower);

    for (let i = 0; i < rows.length; i += 1) {
      const hp = rows[i]!;
      const name = hp.name.trim();
      if (!name) {
        emptyNames += 1;
        continue;
      }
      const key = handlePositionNameDedupeKey(name);
      if (seenNameKeysLower.has(key)) {
        if (strapiNameKeysLower.has(key)) skippedExistingStrapi += 1;
        else skippedDuplicateInExtract += 1;
        continue;
      }

      const imageId = await uploadSwatchImageFromDataUrl(
        hp.image ?? '',
        safeSwatchBasename('handle-position', name, i),
      );
      const body: Record<string, unknown> = { name };
      if (imageId != null) body.imageId = imageId;
      await createHandlePosition(body);
      seenNameKeysLower.add(key);
      created += 1;
    }

    const parts: string[] = [];
    if (created > 0) {
      parts.push(`created ${created} handle position${created === 1 ? '' : 's'}`);
    }
    if (skippedExistingStrapi > 0) {
      parts.push(
        `skipped ${skippedExistingStrapi} already in catalog (same name, case-insensitive)`,
      );
    }
    if (skippedDuplicateInExtract > 0) {
      parts.push(
        `skipped ${skippedDuplicateInExtract} duplicate name${skippedDuplicateInExtract === 1 ? '' : 's'} in import file`,
      );
    }
    if (emptyNames > 0) {
      parts.push(`${emptyNames} row${emptyNames === 1 ? '' : 's'} had no name`);
    }
    let summary =
      parts.length > 0
        ? `Handle positions: ${parts.join('; ')}.`
        : 'Handle positions: nothing new to import.';
    try {
      handlePositionsStrapi.value = await fetchAllHandlePositions();
      handlePositionsForHandlesError.value = '';
    } catch {
      summary +=
        ' Could not refresh the Strapi position list; reload this page before importing handles if linking fails.';
    }
    statusMessage.value = summary;
    statusIsOk.value = true;
    toast.success(summary);
    importedHandlePositionsCatalog.value =
      created > 0 || skippedExistingStrapi > 0 || skippedDuplicateInExtract > 0;
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(e, 'Handle position import failed.');
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    importingHandlePositionsCatalog.value = false;
  }
}

async function runHandlesImportForGroup(groupKey: string) {
  if (importingHandlesGroupKey.value != null || isHandlesGroupImported(groupKey)) return;
  const rowBlock = handlesByTypeAndSubtype.value.find(([k]) => k === groupKey);
  const rows = rowBlock?.[1] ?? [];
  if (!rows.length) return;

  importingHandlesGroupKey.value = groupKey;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  const { type, subtype } = splitHandleGroupKey(groupKey);
  let ok = 0;
  try {
    for (let ri = 0; ri < rows.length; ri += 1) {
      const row = rows[ri]!;
      const gi = globalHandleIndex(groupKey, ri);
      const name = handleCatalogNameForStrapi(row);
      const imageId = await uploadSwatchImageFromDataUrl(
        row.image ?? '',
        safeSwatchBasename('handle', row.code, gi >= 0 ? gi : ri),
      );
      const price = parseEuropeanSurchargePrice(row.surcharge);
      const handlePositionDocumentIds = resolveHandlePositionDocumentIdsFromExtract(row.handlePostions);
      const body: Record<string, unknown> = {
        name,
        position: gi >= 0 ? gi : ri,
        hasHold: false,
      };
      if (price != null) body.price = price;
      if (imageId != null) body.imageId = imageId;
      if (handlePositionDocumentIds.length) body.handlePositionDocumentIds = handlePositionDocumentIds;
      if (row.code.trim()) body.code = row.code.trim();
      if (row.handlePostions.trim()) body.handlePostions = row.handlePostions.trim();
      if (row.height.trim()) body.height = row.height.trim();
      if (row.type.trim()) body.type = row.type.trim();
      if (row.subtype.trim()) body.subtype = row.subtype.trim();
      if (row.description.trim()) body.description = row.description.trim();
      if (row.surcharge.trim()) body.surcharge = row.surcharge.trim();
      await createHandle(body);
      ok += 1;
    }
    importedHandleGroupKeys.value = new Set(importedHandleGroupKeys.value).add(groupKey);
    statusMessage.value = `Imported ${ok} handle${ok === 1 ? '' : 's'} (${type} · ${subtype}).`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(
      e,
      ok > 0
        ? `Import stopped after ${ok} of ${rows.length} handles in group “${type} · ${subtype}”.`
        : `Handle import failed for “${type} · ${subtype}”.`,
    );
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    importingHandlesGroupKey.value = null;
  }
}

async function runFrontsImportForPriceClass(levelKey: string, rows: ExtractedFrontRow[]) {
  if (importingFrontsPriceClass.value != null) return;
  if (isFrontsPriceClassImported(levelKey)) return;
  const priceClassId = strapiPriceClassIdForLevel(levelKey);
  if (priceClassId == null) {
    statusMessage.value = `No Strapi price class with level “${levelKey}”. Add or adjust price class levels, then reload this page.`;
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
    return;
  }

  importingFrontsPriceClass.value = levelKey;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  let ok = 0;
  try {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      const name = row.name.trim() || row.code.trim() || `Front ${i + 1}`;
      const imageId = await uploadFrontRowImage(row, i);
      const body: Record<string, unknown> = {
        name,
        priceClassId,
      };
      if (row.code.trim()) body.code = row.code.trim();
      if (imageId != null) body.imageId = imageId;
      await createFront(body);
      ok += 1;
    }
    importedFrontsPriceClasses.value = new Set(importedFrontsPriceClasses.value).add(levelKey);
    statusMessage.value = `Imported ${ok} front${ok === 1 ? '' : 's'} for price class ${levelKey}.`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(
      e,
      ok > 0 ? `Import stopped after ${ok} of ${rows.length} fronts in class ${levelKey}.` : 'Front import failed.',
    );
    statusIsError.value = true;
    statusIsOk.value = false;
    toast.danger(statusMessage.value);
  } finally {
    importingFrontsPriceClass.value = null;
  }
}

const frontExtractEditorOpen = ref(false);
const frontExtractEditorIndex = ref<number | null>(null);
const frontExtractFormCode = ref('');
const frontExtractFormName = ref('');
const frontExtractFormPriceClass = ref('');
const frontExtractFormImage = ref('');

watch(frontExtractEditorOpen, (open) => {
  if (!open) frontExtractEditorIndex.value = null;
});

function globalIndexForFrontRow(levelKey: string, rowIndexInGroup: number): number {
  let offset = 0;
  for (const [k, rows] of frontsByPriceClass.value) {
    if (k === levelKey) return offset + rowIndexInGroup;
    offset += rows.length;
  }
  return -1;
}

function openFrontExtractEditor(globalIndex: number) {
  if (globalIndex < 0) return;
  const row = extractedFronts.value[globalIndex];
  if (!row) return;
  frontExtractEditorIndex.value = globalIndex;
  frontExtractFormCode.value = row.code;
  frontExtractFormName.value = row.name;
  frontExtractFormPriceClass.value = row.priceClass;
  frontExtractFormImage.value = row.image;
  frontExtractEditorOpen.value = true;
}

function closeFrontExtractEditor() {
  frontExtractEditorOpen.value = false;
}

function saveFrontExtractEditor() {
  const idx = frontExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedFronts.value.length) return;
  const code = frontExtractFormCode.value.trim();
  const name = frontExtractFormName.value.trim();
  if (!code && !name) {
    statusMessage.value = 'Enter a code and/or a name.';
    statusIsError.value = true;
    statusIsOk.value = false;
    return;
  }
  const pc = frontExtractFormPriceClass.value.trim();
  const row = extractedFronts.value[idx]!;
  const next = [...extractedFronts.value];
  next[idx] = {
    ...row,
    code,
    name,
    priceClass: pc.length > 0 ? pc : row.priceClass,
  };
  extractedFronts.value = next;
  jsonText.value = JSON.stringify(next, null, 2);
  importedFrontsPriceClasses.value = new Set();
  statusMessage.value = 'Preview updated.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeFrontExtractEditor();
}

async function deleteFrontExtractRow() {
  const idx = frontExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedFronts.value.length) return;
  const row = extractedFronts.value[idx]!;
  const label = row.name.trim() || row.code || 'this entry';
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove “${label}” from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  const next = extractedFronts.value.filter((_, i) => i !== idx);
  extractedFronts.value = next;
  jsonText.value = next.length ? JSON.stringify(next, null, 2) : '';
  importedFrontsPriceClasses.value = new Set();
  statusMessage.value = 'Front removed from preview.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeFrontExtractEditor();
}

const backExtractEditorOpen = ref(false);
const backExtractEditorIndex = ref<number | null>(null);
const backExtractFormCode = ref('');
const backExtractFormName = ref('');
const backExtractFormImage = ref('');

watch(backExtractEditorOpen, (open) => {
  if (!open) backExtractEditorIndex.value = null;
});

function openBackExtractEditor(index: number) {
  const row = extractedBacks.value[index];
  if (!row) return;
  backExtractEditorIndex.value = index;
  backExtractFormCode.value = row.code;
  backExtractFormName.value = row.name;
  backExtractFormImage.value = row.image;
  backExtractEditorOpen.value = true;
}

function closeBackExtractEditor() {
  backExtractEditorOpen.value = false;
}

function saveBackExtractEditor() {
  const idx = backExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedBacks.value.length) return;
  const code = backExtractFormCode.value.trim();
  const name = backExtractFormName.value.trim();
  if (!code && !name) {
    statusMessage.value = 'Enter a code and/or a name.';
    statusIsError.value = true;
    statusIsOk.value = false;
    return;
  }
  const row = extractedBacks.value[idx]!;
  const next = [...extractedBacks.value];
  next[idx] = { ...row, code, name };
  extractedBacks.value = next;
  jsonText.value = JSON.stringify(next, null, 2);
  backsCatalogImported.value = false;
  statusMessage.value = 'Preview updated.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeBackExtractEditor();
}

async function deleteBackExtractRow() {
  const idx = backExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedBacks.value.length) return;
  const row = extractedBacks.value[idx]!;
  const label = row.name.trim() || row.code || 'this entry';
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove “${label}” from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  const next = extractedBacks.value.filter((_, i) => i !== idx);
  extractedBacks.value = next;
  jsonText.value = next.length ? JSON.stringify(next, null, 2) : '';
  backsCatalogImported.value = false;
  statusMessage.value = 'Back removed from preview.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeBackExtractEditor();
}

const worktopExtractEditorOpen = ref(false);
const worktopExtractEditorIndex = ref<number | null>(null);
const worktopExtractFormCode = ref('');
const worktopExtractFormName = ref('');
const worktopExtractFormNote = ref('');
const worktopExtractFormDescription = ref('');
const worktopExtractFormPrice = ref('');
const worktopExtractFormImage = ref('');

watch(worktopExtractEditorOpen, (open) => {
  if (!open) worktopExtractEditorIndex.value = null;
});

function openWorktopExtractEditor(index: number) {
  const row = extractedWorktops.value[index];
  if (!row) return;
  worktopExtractEditorIndex.value = index;
  worktopExtractFormCode.value = row.code;
  worktopExtractFormName.value = row.name;
  worktopExtractFormNote.value = row.note;
  worktopExtractFormDescription.value = row.description;
  worktopExtractFormPrice.value = row.price;
  worktopExtractFormImage.value = row.image;
  worktopExtractEditorOpen.value = true;
}

function closeWorktopExtractEditor() {
  worktopExtractEditorOpen.value = false;
}

function saveWorktopExtractEditor() {
  const idx = worktopExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedWorktops.value.length) return;
  const code = worktopExtractFormCode.value.trim();
  const name = worktopExtractFormName.value.trim();
  if (!code && !name) {
    statusMessage.value = 'Enter a code and/or a name.';
    statusIsError.value = true;
    statusIsOk.value = false;
    return;
  }
  const row = extractedWorktops.value[idx]!;
  const next = [...extractedWorktops.value];
  next[idx] = {
    ...row,
    code,
    name,
    note: worktopExtractFormNote.value.trim(),
    description: worktopExtractFormDescription.value.trim(),
    price: worktopExtractFormPrice.value.trim(),
  };
  extractedWorktops.value = next;
  jsonText.value = JSON.stringify(next, null, 2);
  worktopsCatalogImported.value = false;
  statusMessage.value = 'Preview updated.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeWorktopExtractEditor();
}

async function deleteWorktopExtractRow() {
  const idx = worktopExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedWorktops.value.length) return;
  const row = extractedWorktops.value[idx]!;
  const label = row.name.trim() || row.code || 'this entry';
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove “${label}” from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  const next = extractedWorktops.value.filter((_, i) => i !== idx);
  extractedWorktops.value = next;
  jsonText.value = next.length ? JSON.stringify(next, null, 2) : '';
  worktopsCatalogImported.value = false;
  statusMessage.value = 'Worktop removed from preview.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeWorktopExtractEditor();
}

const plinthExtractEditorOpen = ref(false);
const plinthExtractEditorIndex = ref<number | null>(null);
const plinthExtractFormCode = ref('');
const plinthExtractFormName = ref('');
const plinthExtractFormDescription = ref('');
const plinthExtractFormHasSurcharge = ref(false);
const plinthExtractFormImage = ref('');

watch(plinthExtractEditorOpen, (open) => {
  if (!open) plinthExtractEditorIndex.value = null;
});

function openPlinthExtractEditor(index: number) {
  const row = extractedPlinths.value[index];
  if (!row) return;
  plinthExtractEditorIndex.value = index;
  plinthExtractFormCode.value = row.code;
  plinthExtractFormName.value = row.name;
  plinthExtractFormDescription.value = row.description;
  plinthExtractFormHasSurcharge.value = row.hasSurcharge === true;
  plinthExtractFormImage.value = row.image;
  plinthExtractEditorOpen.value = true;
}

function closePlinthExtractEditor() {
  plinthExtractEditorOpen.value = false;
}

function savePlinthExtractEditor() {
  const idx = plinthExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedPlinths.value.length) return;
  const code = plinthExtractFormCode.value.trim();
  const name = plinthExtractFormName.value.trim();
  const description = plinthExtractFormDescription.value.trim();
  if (!code && !name && !description) {
    statusMessage.value = 'Enter a code, name, and/or description.';
    statusIsError.value = true;
    statusIsOk.value = false;
    return;
  }
  const row = extractedPlinths.value[idx]!;
  const next = [...extractedPlinths.value];
  next[idx] = { ...row, code, name, description, hasSurcharge: plinthExtractFormHasSurcharge.value };
  extractedPlinths.value = next;
  jsonText.value = JSON.stringify(next, null, 2);
  plinthsBasicImported.value = false;
  plinthsSurchargeImported.value = false;
  statusMessage.value = 'Preview updated.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closePlinthExtractEditor();
}

async function deletePlinthExtractRow() {
  const idx = plinthExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedPlinths.value.length) return;
  const row = extractedPlinths.value[idx]!;
  const label = row.name.trim() || row.code || 'this entry';
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove “${label}” from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  const next = extractedPlinths.value.filter((_, i) => i !== idx);
  extractedPlinths.value = next;
  jsonText.value = next.length ? JSON.stringify(next, null, 2) : '';
  plinthsBasicImported.value = false;
  plinthsSurchargeImported.value = false;
  statusMessage.value = 'Plinth removed from preview.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closePlinthExtractEditor();
}

const handleExtractEditorOpen = ref(false);
const handleExtractEditorIndex = ref<number | null>(null);
const handleExtractFormCode = ref('');
const handleExtractFormName = ref('');
const handleExtractFormHandlePositions = ref('');
const handleExtractFormHeight = ref('');
const handleExtractFormSurcharge = ref('');
const handleExtractFormType = ref('');
const handleExtractFormSubtype = ref('');
const handleExtractFormDescription = ref('');
const handleExtractFormImage = ref('');

watch(handleExtractEditorOpen, (open) => {
  if (!open) handleExtractEditorIndex.value = null;
});

function openHandleExtractEditor(index: number) {
  const row = extractedHandles.value[index];
  if (!row) return;
  handleExtractEditorIndex.value = index;
  handleExtractFormCode.value = row.code;
  handleExtractFormName.value = row.name;
  handleExtractFormHandlePositions.value = row.handlePostions;
  handleExtractFormHeight.value = row.height;
  handleExtractFormSurcharge.value = row.surcharge;
  handleExtractFormType.value = row.type;
  handleExtractFormSubtype.value = row.subtype;
  handleExtractFormDescription.value = row.description;
  handleExtractFormImage.value = row.image;
  handleExtractEditorOpen.value = true;
}

function closeHandleExtractEditor() {
  handleExtractEditorOpen.value = false;
}

function saveHandleExtractEditor() {
  const idx = handleExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedHandles.value.length) return;
  const code = handleExtractFormCode.value.trim();
  const name = handleExtractFormName.value.trim();
  const handlePostions = handleExtractFormHandlePositions.value.trim();
  const height = handleExtractFormHeight.value.trim();
  const surcharge = handleExtractFormSurcharge.value.trim();
  const type = handleExtractFormType.value.trim();
  const subtype = handleExtractFormSubtype.value.trim();
  const description = handleExtractFormDescription.value.trim();
  if (!code && !name && !type && !subtype) {
    statusMessage.value = 'Enter at least a code, name, type, or subtype.';
    statusIsError.value = true;
    statusIsOk.value = false;
    return;
  }
  const row = extractedHandles.value[idx]!;
  const next = [...extractedHandles.value];
  next[idx] = {
    ...row,
    code,
    name,
    handlePostions,
    height,
    surcharge,
    type,
    subtype,
    description,
  };
  extractedHandles.value = next;
  syncHandlesJsonPayloadText();
  importedHandleGroupKeys.value = new Set();
  importedHandlePositionsCatalog.value = false;
  statusMessage.value = 'Preview updated.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeHandleExtractEditor();
}

async function deleteHandleExtractRow() {
  const idx = handleExtractEditorIndex.value;
  if (idx == null || idx < 0 || idx >= extractedHandles.value.length) return;
  const row = extractedHandles.value[idx]!;
  const label = row.name.trim() || row.code || 'this entry';
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove “${label}” from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  const next = extractedHandles.value.filter((_, i) => i !== idx);
  extractedHandles.value = next;
  syncHandlesJsonPayloadText();
  importedHandleGroupKeys.value = new Set();
  importedHandlePositionsCatalog.value = false;
  statusMessage.value = 'Handle removed from preview.';
  statusIsOk.value = true;
  statusIsError.value = false;
  closeHandleExtractEditor();
}

type CatalogPdfExtractedImage =
  | {
      source: 'embedded';
      page: number;
      index: number;
      width: number;
      height: number;
      kind: number;
      filter?: string;
      colorSpace?: string;
      mimeType: string;
      dataUrl: string;
    }
  | {
      source: 'page-render';
      page: number;
      scale: number;
      mimeType: 'image/png';
      dataUrl: string;
    }
  | {
      source: 'row-crop';
      page: number;
      groupIndex: number;
      mimeType: 'image/png' | 'image/svg+xml';
      dataUrl: string;
    };

type CatalogPdfEmbeddedImage = Extract<CatalogPdfExtractedImage, { source: 'embedded' }>;
type CatalogPdfPageRenderImage = Extract<CatalogPdfExtractedImage, { source: 'page-render' }>;
type CatalogPdfRowCropImage = Extract<CatalogPdfExtractedImage, { source: 'row-crop' }>;

const jsonText = ref('');
/** When false, the JSON textarea is hidden to free vertical space; value is preserved. */
const showJsonEditor = ref(false);
const loadedFileName = ref<string | null>(null);
const pdfParsing = ref(false);
/** Last successful PDF parse: embedded XObjects and/or page PNG renders from `/api/catalog-import/parse-pdf`. */
const pdfExtractImages = ref<CatalogPdfExtractedImage[]>([]);
const selectedSeriesDocumentId = ref('');

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
    label: `${s.name} (${s.code})`,
  })),
);

const statusMessage = ref('');
const statusIsError = ref(false);
const statusIsOk = ref(false);
const validationErrors = ref<string[]>([]);
const previewGroups = ref<CatalogProductImport | null>(null);
const importingGroupIndex = ref<number | null>(null);
const importedGroupIndexes = ref<Set<number>>(new Set());

const canRunCatalogImport = computed(
  () => selectedSeriesDocumentId.value.trim().length > 0 && importingGroupIndex.value === null,
);

function clearStatus() {
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;
  validationErrors.value = [];
  previewGroups.value = null;
  importedGroupIndexes.value = new Set();
  /** Keep `pdfExtractImages` so thumbs survive Validate / JSON edits after a PDF upload. Cleared when loading a JSON file from disk (`onFileSelected`). */
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

function pdfImageAlt(img: CatalogPdfExtractedImage): string {
  if (img.source === 'embedded') return `Page ${img.page}, embedded image ${img.index}`;
  if (img.source === 'row-crop') return `Page ${img.page}, row graphic preview`;
  return `Page ${img.page}, rendered preview`;
}

function pdfImageCaption(img: CatalogPdfExtractedImage): string {
  if (img.source === 'embedded') {
    return `p.${img.page} · embedded #${img.index} · ${img.width}×${img.height}px`;
  }
  if (img.source === 'row-crop') {
    return `p.${img.page} · drawing · row ${img.groupIndex + 1}`;
  }
  return `p.${img.page} · page render · ${img.scale}×`;
}

/** Map PDF extract output to preview card index: row-crops by group, else embedded order, else page render(s). */
function resolvePdfThumbForGroup(
  gi: number,
  imgs: CatalogPdfExtractedImage[],
): CatalogPdfExtractedImage | null {
  if (!imgs.length) return null;

  const rowCrops = imgs.filter((x): x is CatalogPdfRowCropImage => x.source === 'row-crop');
  if (rowCrops.length > 0) {
    const byIndex = rowCrops.find((r) => r.groupIndex === gi);
    if (byIndex) return byIndex;
    const sorted = [...rowCrops].sort((a, b) => a.groupIndex - b.groupIndex);
    return sorted[gi] ?? sorted[sorted.length - 1] ?? null;
  }

  const embedded = imgs.filter((x): x is CatalogPdfEmbeddedImage => x.source === 'embedded');
  const renders = imgs.filter((x): x is CatalogPdfPageRenderImage => x.source === 'page-render');

  if (embedded.length > 0) {
    if (gi < embedded.length) return embedded[gi]!;
    return embedded[embedded.length - 1]!;
  }

  if (renders.length > 0) {
    if (renders.length === 1) return renders[0]!;
    return renders[Math.min(gi, renders.length - 1)]!;
  }

  return null;
}

type PreviewCardThumb = { src: string; alt: string; caption: string };

function catalogImageThumbForGroup(group: CatalogProductGroup): PreviewCardThumb | null {
  const s = group.image?.trim();
  if (!s) return null;
  if (s.startsWith('data:')) {
    return { src: s, alt: group.name.trim() || 'Product image', caption: 'From catalog JSON' };
  }
  if (/^https?:\/\//i.test(s)) {
    return { src: s, alt: group.name.trim() || 'Product image', caption: 'From catalog JSON' };
  }
  if (s.startsWith('/')) {
    return { src: s, alt: group.name.trim() || 'Product image', caption: 'From catalog JSON' };
  }
  return null;
}

/** PDF extract per card when available; else a usable `group.image` URL/data URL. */
const previewCardThumbs = computed<(PreviewCardThumb | null)[]>(() => {
  const groups = previewGroups.value;
  if (!groups?.length) return [];
  const imgs = pdfExtractImages.value;
  return groups.map((group, gi) => {
    const pdfImg = resolvePdfThumbForGroup(gi, imgs);
    if (pdfImg) {
      return {
        src: pdfImg.dataUrl,
        alt: pdfImageAlt(pdfImg),
        caption: pdfImageCaption(pdfImg),
      };
    }
    return catalogImageThumbForGroup(group);
  });
});

function formatWidthMm(w: CatalogWidthEntry): string {
  if (w.value != null) return `${w.value} mm`;
  if (w.min != null && w.max != null) return `${w.min}–${w.max} mm`;
  if (w.min != null || w.max != null) return `${w.min ?? '…'}–${w.max ?? '…'} mm`;
  return '—';
}

function priceForClass(groups: CatalogPriceGroup[], cls: number): string {
  const row = groups.find((g) => g.class === cls);
  return row != null ? String(row.price) : '—';
}

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
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    importedFrontsPriceClasses.value = new Set();
    backsCatalogImported.value = false;
    worktopsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
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
  warnings: string[];
  images: CatalogPdfExtractedImage[];
};

type ExtractFrontsPdfOk = {
  ok: true;
  data: ExtractedFrontRow[];
  warnings: string[];
};

type ExtractBacksPdfOk = {
  ok: true;
  data: ExtractedBackRow[];
  warnings: string[];
};

type ExtractPlinthsPdfOk = {
  ok: true;
  data: ExtractedPlinthRow[];
  warnings: string[];
};

type ExtractHandlesPdfOk = {
  ok: true;
  data: HandlesExtractPayload;
  warnings: string[];
};

type ExtractWorktopsPdfOk = {
  ok: true;
  data: Array<{
    image: string;
    code: string;
    note: string;
    name: string;
    description: string;
  }>;
  warnings: string[];
};

async function onPdfSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || pdfParsing.value) return;

  if (bulkImportTarget.value === 'handles') {
    pdfParsing.value = true;
    clearStatus();
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedPlinths.value = [];
    extractedWorktops.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    importedFrontsPriceClasses.value = new Set();
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    backsCatalogImported.value = false;
    worktopsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
    loadedFileName.value = file.name;
    previewGroups.value = null;

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await $fetch<ExtractHandlesPdfOk>('/api/catalog-import/extract-handles', {
        method: 'POST',
        body,
      });
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
      statusIsError.value = false;
    } catch (e: unknown) {
      loadedFileName.value = null;
      extractedHandles.value = [];
      extractedHandlePositions.value = [];
      const fe = e as {
        data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
        statusMessage?: string;
        message?: string;
      };
      const msg = getFetchErrorMessage(e, 'Could not extract handles from PDF.');
      const extra: string[] = [];
      if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
        extra.push(...fe.data.warnings.map((x) => `[Handles] ${x}`));
      }
      if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
        extra.push(...fe.data.errors);
      }
      validationErrors.value = extra;
      statusMessage.value = msg;
      statusIsError.value = true;
      statusIsOk.value = false;
    } finally {
      pdfParsing.value = false;
    }
    return;
  }

  if (bulkImportTarget.value === 'worktops') {
    pdfParsing.value = true;
    clearStatus();
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedPlinths.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    extractedWorktops.value = [];
    importedFrontsPriceClasses.value = new Set();
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    backsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
    worktopsCatalogImported.value = false;
    loadedFileName.value = file.name;
    previewGroups.value = null;

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await $fetch<ExtractWorktopsPdfOk>('/api/catalog-import/extract-worktops', {
        method: 'POST',
        body,
      });
      extractedWorktops.value = res.data.map((r) => ({
        image: r.image,
        code: r.code,
        note: r.note,
        name: r.name,
        description: r.description,
        price: '',
      }));
      jsonText.value = JSON.stringify(extractedWorktops.value, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Worktops] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} worktop row${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      statusIsError.value = false;
    } catch (e: unknown) {
      loadedFileName.value = null;
      extractedWorktops.value = [];
      const fe = e as {
        data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
        statusMessage?: string;
        message?: string;
      };
      const msg = getFetchErrorMessage(e, 'Could not extract worktops from PDF.');
      const extra: string[] = [];
      if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
        extra.push(...fe.data.warnings.map((x) => `[Worktops] ${x}`));
      }
      if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
        extra.push(...fe.data.errors);
      }
      validationErrors.value = extra;
      statusMessage.value = msg;
      statusIsError.value = true;
      statusIsOk.value = false;
    } finally {
      pdfParsing.value = false;
    }
    return;
  }

  if (bulkImportTarget.value === 'plinths') {
    pdfParsing.value = true;
    clearStatus();
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    extractedWorktops.value = [];
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    worktopsCatalogImported.value = false;
    extractedPlinths.value = [];
    importedFrontsPriceClasses.value = new Set();
    backsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
    loadedFileName.value = file.name;
    previewGroups.value = null;

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await $fetch<ExtractPlinthsPdfOk>('/api/catalog-import/extract-plinths', {
        method: 'POST',
        body,
      });
      extractedPlinths.value = res.data;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Plinths] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} plinth${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      statusIsError.value = false;
    } catch (e: unknown) {
      loadedFileName.value = null;
      extractedPlinths.value = [];
      const fe = e as {
        data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
        statusMessage?: string;
        message?: string;
      };
      const msg = getFetchErrorMessage(e, 'Could not extract plinths from PDF.');
      const extra: string[] = [];
      if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
        extra.push(...fe.data.warnings.map((x) => `[Plinths] ${x}`));
      }
      if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
        extra.push(...fe.data.errors);
      }
      validationErrors.value = extra;
      statusMessage.value = msg;
      statusIsError.value = true;
      statusIsOk.value = false;
    } finally {
      pdfParsing.value = false;
    }
    return;
  }

  if (bulkImportTarget.value === 'backs') {
    pdfParsing.value = true;
    clearStatus();
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    extractedWorktops.value = [];
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    extractedPlinths.value = [];
    importedFrontsPriceClasses.value = new Set();
    backsCatalogImported.value = false;
    worktopsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
    loadedFileName.value = file.name;
    previewGroups.value = null;

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await $fetch<ExtractBacksPdfOk>('/api/catalog-import/extract-backs', {
        method: 'POST',
        body,
      });
      extractedBacks.value = res.data;
      backsCatalogImported.value = false;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Backs] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} back${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      statusIsError.value = false;
    } catch (e: unknown) {
      loadedFileName.value = null;
      extractedBacks.value = [];
      const fe = e as {
        data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
        statusMessage?: string;
        message?: string;
      };
      const msg = getFetchErrorMessage(e, 'Could not extract backs from PDF.');
      const extra: string[] = [];
      if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
        extra.push(...fe.data.warnings.map((x) => `[Backs] ${x}`));
      }
      if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
        extra.push(...fe.data.errors);
      }
      validationErrors.value = extra;
      statusMessage.value = msg;
      statusIsError.value = true;
      statusIsOk.value = false;
    } finally {
      pdfParsing.value = false;
    }
    return;
  }

  if (bulkImportTarget.value === 'fronts') {
    pdfParsing.value = true;
    clearStatus();
    pdfExtractImages.value = [];
    extractedFronts.value = [];
    extractedBacks.value = [];
    extractedHandles.value = [];
    extractedHandlePositions.value = [];
    extractedWorktops.value = [];
    importedHandleGroupKeys.value = new Set();
    importedHandlePositionsCatalog.value = false;
    extractedPlinths.value = [];
    importedFrontsPriceClasses.value = new Set();
    backsCatalogImported.value = false;
    worktopsCatalogImported.value = false;
    plinthsBasicImported.value = false;
    plinthsSurchargeImported.value = false;
    loadedFileName.value = file.name;
    previewGroups.value = null;

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await $fetch<ExtractFrontsPdfOk>('/api/catalog-import/extract-fronts', {
        method: 'POST',
        body,
      });
      extractedFronts.value = res.data;
      jsonText.value = JSON.stringify(res.data, null, 2);
      showJsonEditor.value = false;
      const w = res.warnings ?? [];
      validationErrors.value = w.map((x) => `[Fronts] ${x}`);
      const wNote = w.length ? ` (${w.length} ZIP notice${w.length === 1 ? '' : 's'}).` : '.';
      statusMessage.value = `Extracted ${res.data.length} front${res.data.length === 1 ? '' : 's'} from PDF${wNote}`;
      statusIsOk.value = true;
      statusIsError.value = false;
    } catch (e: unknown) {
      loadedFileName.value = null;
      extractedFronts.value = [];
      const fe = e as {
        data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
        statusMessage?: string;
        message?: string;
      };
      const msg = getFetchErrorMessage(e, 'Could not extract fronts from PDF.');
      const extra: string[] = [];
      if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
        extra.push(...fe.data.warnings.map((x) => `[Fronts] ${x}`));
      }
      if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
        extra.push(...fe.data.errors);
      }
      validationErrors.value = extra;
      statusMessage.value = msg;
      statusIsError.value = true;
      statusIsOk.value = false;
    } finally {
      pdfParsing.value = false;
    }
    return;
  }

  pdfParsing.value = true;
  clearStatus();
  pdfExtractImages.value = [];
  extractedFronts.value = [];
  extractedBacks.value = [];
  extractedHandles.value = [];
  extractedHandlePositions.value = [];
  importedHandleGroupKeys.value = new Set();
  importedHandlePositionsCatalog.value = false;
  extractedPlinths.value = [];
  extractedWorktops.value = [];
  backsCatalogImported.value = false;
  worktopsCatalogImported.value = false;
  plinthsBasicImported.value = false;
  plinthsSurchargeImported.value = false;
  loadedFileName.value = file.name;

  try {
    const body = new FormData();
    body.append('file', file);

    const res = await $fetch<ParsePdfOk>('/api/catalog-import/parse-pdf', {
      method: 'POST',
      body,
    });

    jsonText.value = JSON.stringify(res.data, null, 2);
    previewGroups.value = res.data;
    showJsonEditor.value = false;

    const notice =
      res.warnings.length > 0
        ? ` Parsed with ${res.warnings.length} notice(s) — review the JSON and preview.`
        : ' Review the JSON and preview before importing.';

    validationErrors.value = res.warnings.length ? res.warnings.map((w) => `[PDF] ${w}`) : [];
    pdfExtractImages.value = Array.isArray(res.images) ? res.images : [];
    statusMessage.value = `PDF converted: ${res.data.length} product group${res.data.length === 1 ? '' : 's'}.${notice}`;
    statusIsOk.value = true;
    statusIsError.value = false;
  } catch (e: unknown) {
    loadedFileName.value = null;
    const fe = e as {
      data?: { warnings?: string[]; errors?: string[]; message?: string; statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    const msg = getFetchErrorMessage(e, 'Could not parse PDF.');
    const extra: string[] = [];
    if (Array.isArray(fe.data?.warnings) && fe.data.warnings.length) {
      extra.push(...fe.data.warnings.map((w) => `[PDF] ${w}`));
    }
    if (Array.isArray(fe.data?.errors) && fe.data.errors.length) {
      extra.push(...fe.data.errors);
    }
    validationErrors.value = extra;
    statusMessage.value = msg;
    statusIsError.value = true;
    statusIsOk.value = false;
  } finally {
    pdfParsing.value = false;
  }
}

watch(bulkImportTarget, () => {
  extractedFronts.value = [];
  extractedBacks.value = [];
  extractedPlinths.value = [];
  extractedWorktops.value = [];
  extractedHandles.value = [];
  extractedHandlePositions.value = [];
  importedHandleGroupKeys.value = new Set();
  importedHandlePositionsCatalog.value = false;
  importedFrontsPriceClasses.value = new Set();
  backsCatalogImported.value = false;
  worktopsCatalogImported.value = false;
  plinthsBasicImported.value = false;
  plinthsSurchargeImported.value = false;
});

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
  statusMessage.value = `Ready: ${result.data.length} product group${result.data.length === 1 ? '' : 's'}. Use “Import to catalog” on each card (pick a series above).`;
  statusIsOk.value = true;
  previewGroups.value = result.data;
  importedGroupIndexes.value = new Set();
}

function isGroupImported(index: number): boolean {
  return importedGroupIndexes.value.has(index);
}

function fileNameForPdfImage(img: CatalogPdfExtractedImage, gi: number): string {
  const ext = img.mimeType === 'image/svg+xml' ? 'svg' : 'png';
  if (img.source === 'embedded') return `catalog-p${img.page}-embedded-${img.index}.${ext}`;
  if (img.source === 'row-crop') return `catalog-p${img.page}-row-${img.groupIndex + 1}.${ext}`;
  return `catalog-p${img.page}-render-${gi + 1}.${ext}`;
}

async function uploadGroupImageId(gi: number): Promise<number | undefined> {
  const pdfImg = resolvePdfThumbForGroup(gi, pdfExtractImages.value);
  if (!pdfImg) return undefined;

  const imgRes = await fetch(pdfImg.dataUrl);
  if (!imgRes.ok) {
    throw new Error('Could not prepare preview image for upload.');
  }
  const blob = await imgRes.blob();
  const fd = new FormData();
  fd.append('file', blob, fileNameForPdfImage(pdfImg, gi));

  const uploadRaw = await uploadMedia(fd);
  const parsed = parseUploadResponseId(uploadRaw);
  if (!parsed?.id) {
    throw new Error('Upload succeeded but no media id was returned.');
  }
  return parsed.id;
}

async function runCatalogImportForGroup(gi: number) {
  const seriesId = selectedSeriesDocumentId.value.trim();
  if (!seriesId || !previewGroups.value?.[gi]) return;
  if (isGroupImported(gi)) return;

  importingGroupIndex.value = gi;
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;

  try {
    const product = previewGroups.value[gi];
    const imageId = await uploadGroupImageId(gi);
    const res = await importCatalogProduct({
      cabinetSeriesDocumentId: seriesId,
      product,
      imageId,
    });
    const imageNote = imageId ? ` image #${imageId} linked,` : '';
    statusMessage.value = `Imported “${product.name.trim() || product.description.slice(0, 40)}…” — cabinet type ${res.cabinetType.documentId},${imageNote} ${res.variantCount} variant(s), ${res.cabinetPricesCreated} price row(s).`;
    statusIsOk.value = true;
    toast.success(statusMessage.value);
    importedGroupIndexes.value = new Set(importedGroupIndexes.value).add(gi);
  } catch (e: unknown) {
    statusMessage.value = getFetchErrorMessage(e, 'Import failed.');
    statusIsError.value = true;
    toast.danger(statusMessage.value);
  } finally {
    importingGroupIndex.value = null;
  }
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

.bulk-import__field--mode {
  margin-bottom: 1rem;
}

.bulk-import__mode-toggle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.bulk-import__mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.bulk-import__mode-btn:hover {
  color: var(--color-text-primary);
  background: rgba(27, 58, 92, 0.06);
}

.bulk-import__mode-btn--active {
  color: var(--color-text-primary);
  background: rgba(27, 58, 92, 0.1);
  box-shadow: 0 0 0 1px rgba(27, 58, 92, 0.12);
}

.bulk-import__mode-btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-brand);
  opacity: 0.85;
}

.bulk-import__mode-hint {
  margin: 0.35rem 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
  max-width: 52rem;
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
  transform-origin: 44px 46px;
  animation: bulk-import-pdf-float 2.6s ease-in-out infinite;
}

.bulk-import__pdf-svg-page {
  animation: bulk-import-pdf-page-pulse 2.6s ease-in-out infinite;
}

.bulk-import__pdf-svg-scan {
  animation: bulk-import-pdf-scan 2.1s ease-in-out infinite;
  will-change: transform;
}

.bulk-import__pdf-svg-orb {
  transform-origin: 58px 24px;
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

/* ---- Fronts extract preview ---- */

.bulk-import__fronts-preview {
  margin-top: 2rem;
  max-width: 1100px;
}

.bulk-import__fronts-class-block {
  margin-bottom: 2rem;
}

.bulk-import__fronts-class-block:last-child {
  margin-bottom: 0;
}

.bulk-import__fronts-class-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  margin-bottom: 0.75rem;
}

.bulk-import__fronts-class-import-btn {
  flex-shrink: 0;
}

.bulk-import__fronts-class-import-btn--success {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  opacity: 1 !important;
}

.bulk-import__fronts-class-import-btn--success:hover {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  background: rgba(6, 118, 71, 0.08) !important;
}

.bulk-import__fronts-class-import-btn--success .base-btn__icon {
  color: var(--color-success, #067647) !important;
}

.bulk-import__fronts-class-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin: 0;
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.bulk-import__fronts-class-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
  font-size: var(--paragraph-size-small);
  background: rgba(27, 58, 92, 0.1);
  color: var(--color-brand);
}

.bulk-import__fronts-class-count {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.bulk-import__fronts-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.bulk-import__fronts-card {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-card);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  min-height: 0;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.bulk-import__fronts-card:hover {
  border-color: rgba(27, 58, 92, 0.35);
  box-shadow: 0 4px 14px rgba(27, 58, 92, 0.1);
}

.bulk-import__fronts-card:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.bulk-import__front-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bulk-import__front-edit-thumb-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.bulk-import__front-edit-thumb {
  max-width: 100%;
  max-height: 160px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: #fff;
}

.bulk-import__front-edit-hint {
  margin: 0.75rem 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.bulk-import__front-edit-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.bulk-import__front-edit-footer-spacer {
  flex: 1;
  min-width: 0.5rem;
}

.bulk-import__fronts-card-media {
  background: #fff;
  border-bottom: 1px solid var(--color-border-subtle);
}

.bulk-import__fronts-card-img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  padding: 0.35rem;
  box-sizing: border-box;
}

.bulk-import__fronts-card-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  background: var(--color-surface);
}

.bulk-import__fronts-card-img-icon {
  width: 1.75rem;
  height: 1.75rem;
  opacity: 0.55;
}

.bulk-import__fronts-card-body {
  padding: 0.5rem 0.6rem 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  text-align: center;
}

.bulk-import__fronts-code {
  display: block;
  width: 100%;
  font-size: 11px;
  word-break: break-word;
  text-align: center;
}

.bulk-import__fronts-name {
  margin: 0;
  width: 100%;
  font-size: 11px;
  line-height: 1.35;
  color: var(--color-text-primary);
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bulk-import__plinth-card-desc {
  margin: 0.15rem 0 0;
  width: 100%;
  font-size: 10px;
  line-height: 1.3;
  color: var(--color-text-muted);
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bulk-import__plinth-surcharge-field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
  cursor: pointer;
  line-height: 1.45;
}

.bulk-import__plinth-surcharge-checkbox {
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.bulk-import__plinths-section {
  margin-bottom: 2rem;
}

.bulk-import__plinths-section:last-child {
  margin-bottom: 0;
}

.bulk-import__handles-preview .bulk-import__handles-subsection-title {
  margin: 0 0 0.35rem;
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.bulk-import__handles-positions-meta {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.bulk-import__handles-position-label {
  margin: 0;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: center;
}

.bulk-import__handles-position-card {
  cursor: default;
}

.bulk-import__handles-position-card:focus-visible {
  outline: none;
}

.bulk-import__handles-group-title {
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
}

.bulk-import__handles-group-type {
  font-weight: var(--font-weight-semibold);
}

.bulk-import__handles-group-sep {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.bulk-import__handles-group-subtype {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}

.bulk-import__handles-card-meta {
  margin: 0;
  font-size: 10px;
  line-height: 1.25;
  color: var(--color-text-muted);
  text-align: center;
}

/* ---- Preview widgets ---- */

.bulk-import__preview {
  margin-top: 2rem;
  max-width: 960px;
}

.bulk-import__preview-title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.35rem;
}

.bulk-import__preview-desc {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

.bulk-import__widget {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
  margin-bottom: 1.25rem;
}

.bulk-import__widget-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
}

.bulk-import__widget-thumb {
  flex: 0 0 auto;
  width: min(140px, 28vw);
  max-width: 160px;
  position: sticky;
  top: 0.75rem;
}

.bulk-import__widget-thumb-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: #fff;
  object-fit: contain;
}

.bulk-import__widget-thumb-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 112px;
  aspect-ratio: 4 / 5;
  max-height: 200px;
  box-sizing: border-box;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px dashed var(--color-border-subtle);
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.bulk-import__widget-thumb-placeholder-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  opacity: 0.65;
}

.bulk-import__widget-thumb-cap {
  display: block;
  margin-top: 0.35rem;
  font-size: 10px;
  line-height: 1.3;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.bulk-import__widget-content {
  flex: 1;
  min-width: 0;
}

.bulk-import__widget:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .bulk-import__widget-layout {
    flex-direction: column;
  }

  .bulk-import__widget-thumb {
    width: 100%;
    max-width: none;
    position: static;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bulk-import__widget-thumb-img {
    max-width: 280px;
  }

  .bulk-import__widget-thumb-placeholder {
    max-width: 280px;
    min-height: 120px;
  }
}

.bulk-import__widget-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.bulk-import__widget-head-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.bulk-import__widget-import-btn {
  flex-shrink: 0;
}

.bulk-import__widget-import-btn--success {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  opacity: 1 !important;
}

.bulk-import__widget-import-btn--success:hover {
  border-color: var(--color-success, #067647) !important;
  color: var(--color-success, #067647) !important;
  background: rgba(6, 118, 71, 0.08) !important;
}

.bulk-import__widget-import-btn--success .base-btn__icon {
  color: var(--color-success, #067647) !important;
}

.bulk-import__widget-index {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  border-radius: 8px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand);
  background: rgba(27, 58, 92, 0.08);
}

.bulk-import__widget-titles {
  min-width: 0;
}

.bulk-import__widget-name {
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.35;
}

.bulk-import__widget-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.35rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.bulk-import__widget-meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.bulk-import__widget-desc {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
  line-height: 1.5;
  margin: 0 0 1rem;
}

.bulk-import__block {
  margin-top: 1rem;
}

.bulk-import__block:first-of-type {
  margin-top: 0;
}

.bulk-import__block-title {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
}

.bulk-import__table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
}

.bulk-import__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--paragraph-size-small);
}

.bulk-import__table th,
.bulk-import__table td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: top;
}

.bulk-import__table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  background: var(--color-surface);
}

.bulk-import__table tbody tr:last-child th,
.bulk-import__table tbody tr:last-child td {
  border-bottom: none;
}

.bulk-import__th-pg-banner {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-left: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: middle;
}

.bulk-import__th-pg-sub {
  text-align: right;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  min-width: 2.75rem;
}

.bulk-import__table thead tr:nth-child(2) .bulk-import__th-pg-sub:first-child {
  border-left: 1px solid var(--color-border-subtle);
}

.bulk-import__pg-col {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: 12px;
}

.bulk-import__table:not(.bulk-import__table--surcharge) tbody td:nth-child(4) {
  border-left: 1px solid var(--color-border-subtle);
}

.bulk-import__table--surcharge tbody td:nth-child(3) {
  border-left: 1px solid var(--color-border-subtle);
}


.bulk-import__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(27, 58, 92, 0.06);
  color: var(--color-text-primary);
}

.bulk-import__code--inline {
  margin-left: 0.35rem;
}

.bulk-import__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bulk-import__chip {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.bulk-import__chip-value {
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.bulk-import__chip-name {
  font-size: 12px;
  color: var(--color-text-muted);
}

.bulk-import__surcharge-name {
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
}

.bulk-import__table--surcharge .bulk-import__surcharge-name {
  font-size: 12px;
}

@keyframes bulk-import-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes bulk-import-pdf-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes bulk-import-pdf-page-pulse {
  0%,
  100% {
    stroke-opacity: 1;
  }
  50% {
    stroke-opacity: 0.72;
  }
}

@keyframes bulk-import-pdf-scan {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(48px);
    opacity: 0.95;
  }
}

@keyframes bulk-import-pdf-orb {
  0%,
  100% {
    transform: scale(0.75);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>
