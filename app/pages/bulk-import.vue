<template>
  <div>
    <CmsPageHeader
      title="Bulk import"
      description="Paste catalog JSON or upload a .json file. Validate the structure, then import when ready (upload API coming soon)."
    />

    <div class="bulk-import__card">
      <div class="bulk-import__row bulk-import__row--actions-top">
        <label class="bulk-import__file-btn">
          <input
            type="file"
            accept=".json,application/json"
            class="bulk-import__file-input"
            @change="onFileSelected"
          />
          <Icon name="lucide:file-up" class="bulk-import__file-icon" />
          Choose JSON file
        </label>
        <span v-if="loadedFileName" class="bulk-import__file-name">{{ loadedFileName }}</span>
      </div>

      <div class="bulk-import__field">
        <label for="bulk-import-json" class="bulk-import__label">JSON</label>
        <textarea
          id="bulk-import-json"
          v-model="jsonText"
          class="bulk-import__textarea"
          spellcheck="false"
          autocomplete="off"
          rows="18"
          placeholder='[ { "name": "…", "image": "", "description": "…", "width": [ … ], "depthOptions": [], "surcharges": [] } ]'
        />
      </div>

      <p v-if="statusMessage" class="bulk-import__hint" :class="{ 'bulk-import__hint--error': statusIsError, 'bulk-import__hint--ok': statusIsOk }">
        {{ statusMessage }}
      </p>

      <ul v-if="validationErrors.length > 0" class="bulk-import__errors" aria-live="polite">
        <li v-for="(err, i) in validationErrors" :key="i">{{ err }}</li>
      </ul>

      <div class="bulk-import__row bulk-import__row--footer">
        <BaseButton type="button" variant="outlined" :disabled="!jsonText.trim()" @click="runValidate">
          <Icon name="lucide:check-circle" class="base-btn__icon" />
          Validate
        </BaseButton>
        <BaseButton type="button" :disabled="!jsonText.trim()" @click="runImport">
          <Icon name="lucide:upload-cloud" class="base-btn__icon" />
          Import
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { parseAndValidateCatalogImport } from '../utils/validateCatalogProductImport';

const jsonText = ref('');
const loadedFileName = ref<string | null>(null);

const statusMessage = ref('');
const statusIsError = ref(false);
const statusIsOk = ref(false);
const validationErrors = ref<string[]>([]);

function clearStatus() {
  statusMessage.value = '';
  statusIsError.value = false;
  statusIsOk.value = false;
  validationErrors.value = [];
}

watch(jsonText, () => {
  clearStatus();
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

function runValidate() {
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
}

function runImport() {
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

  // TODO: POST to bulk-import API when available
  console.log('[bulk-import] payload', result.data);
  statusMessage.value = `Ready to import ${result.data.length} product group${result.data.length === 1 ? '' : 's'} (logged to console).`;
  statusIsOk.value = true;
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

.bulk-import__file-icon {
  width: 18px;
  height: 18px;
  color: var(--color-brand);
}

.bulk-import__file-name {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
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
</style>
