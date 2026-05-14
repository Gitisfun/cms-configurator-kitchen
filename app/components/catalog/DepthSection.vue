<template>
  <div class="catalog-depth-section">
    <div class="catalog-depth-section__head">
      <h3 class="catalog-depth-section__title">Depth options</h3>
      <BaseButton type="button" variant="text" size="sm" @click="$emit('link')">
        <Icon name="lucide:plus" class="base-btn__icon" />
        Link depth option
      </BaseButton>
    </div>
    <div v-if="depthOptions.length > 0" class="catalog-depth-matrix-wrap">
      <table class="catalog-depth-matrix">
        <thead>
          <tr>
            <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-name">Name</th>
            <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-mm">Depth <span class="catalog-matrix__th-sub">(mm)</span></th>
            <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-edit" aria-label="Edit"></th>
            <th scope="col" class="catalog-depth-matrix__th catalog-depth-matrix__th-remove" aria-label="Remove"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="opt in depthOptions" :key="opt.documentId" class="catalog-depth-matrix__row">
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-name">{{ opt.name }}</td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-mm">{{ opt.depth }}</td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-edit">
              <BaseButton type="button" variant="text" size="sm" @click="$emit('edit', opt)"> Edit </BaseButton>
            </td>
            <td class="catalog-depth-matrix__td catalog-depth-matrix__td-remove">
              <BaseButton
                type="button"
                variant="text"
                danger
                size="sm"
                :disabled="unlinkingDocumentId !== null"
                :loading="unlinkingDocumentId === opt.documentId"
                @click="$emit('unlink', opt)"
              >
                Remove
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="catalog-depth-section__empty">No depth options linked yet. Use Link depth option to attach rows from the library.</p>
  </div>
</template>

<script setup lang="ts">
import type { DepthOption } from '../../models/depth-option';

defineProps<{
  depthOptions: DepthOption[];
  unlinkingDocumentId: string | null;
}>();

defineEmits<{
  link: [];
  edit: [opt: DepthOption];
  unlink: [opt: DepthOption];
}>();
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

.catalog-depth-matrix-wrap {
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
}

.catalog-depth-matrix {
  width: 100%;
  table-layout: fixed;
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

.catalog-depth-matrix__th:last-child,
.catalog-depth-matrix__td:last-child {
  border-right: none;
}

.catalog-depth-matrix tbody tr:last-child .catalog-depth-matrix__td {
  border-bottom: none;
}

.catalog-depth-matrix__row:hover .catalog-depth-matrix__td {
  background: var(--color-surface-hover);
}

.catalog-depth-matrix__th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: left;
}

.catalog-depth-matrix__th-name {
  width: auto;
  min-width: 6rem;
}

.catalog-depth-matrix__th-mm {
  width: 7rem;
  min-width: 7rem;
  text-align: right;
}

.catalog-depth-matrix__th-edit {
  width: 4.75rem;
  min-width: 4.75rem;
  text-align: right;
  font-size: 0.7rem;
}

.catalog-depth-matrix__th-remove {
  width: 5.75rem;
  min-width: 5.75rem;
  text-align: center;
  font-size: 0.7rem;
}

.catalog-depth-matrix__td-name {
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
  word-break: break-word;
}

.catalog-depth-matrix__td-mm {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.catalog-depth-matrix__td-edit {
  text-align: right;
  white-space: nowrap;
  vertical-align: middle;
}

.catalog-depth-matrix__td-remove {
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}

.catalog-depth-matrix__td-edit :deep(.base-btn) {
  font-size: 0.78rem;
}

.catalog-depth-matrix__td-remove :deep(.base-btn) {
  font-size: 0.78rem;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}

.catalog-matrix__th-sub {
  display: block;
  font-size: 0.65rem;
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-muted);
  margin-top: 0.1rem;
}
</style>
