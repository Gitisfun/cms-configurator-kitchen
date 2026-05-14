<template>
  <div>
    <CmsPageHeader title="Cabinet type surcharges" description="Surcharges (name, code, optional dimension, optional value size).">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add surcharge
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel
      :pending="pending"
      :error="!!error"
      :pagination="pagination"
      :empty-first-page="rows.length === 0 && page === 1"
      :empty-off-page="rows.length === 0 && page > 1"
      :item-count="rows.length"
      :page="page"
    >
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'surcharge' : 'surcharges' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading surcharges&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load surcharges.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:percent" />
        </div>
        <h3 class="base-panel__empty-title">No surcharges yet</h3>
        <p class="base-panel__empty-desc">Add surcharges for socket options, depth extras, and other fixed fees.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create surcharge
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No surcharges on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(rows.map((r) => r.documentId))"
                :indeterminate="someOnPageSelected(rows.map((r) => r.documentId)) && !allOnPageSelected(rows.map((r) => r.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(rows.map((r) => r.documentId))"
              />
            </th>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Dimension</th>
            <th scope="col">Value size</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId" :class="{ 'base-table__row--selected': isSelected(row.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(row.documentId)" :aria-label="`Select ${row.name}`" @change="toggle(row.documentId)" />
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:percent" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td>{{ row.code }}</td>
          <td>{{ TableHelpers.formatDimension(row.dimension) }}</td>
          <td>{{ Format.priceEur(row.value ?? null) }}</td>
          <td>{{ Format.dateTime(row.publishedAt) }}</td>
          <td>{{ Format.dateTime(row.updatedAt) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Surcharge pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetTypeSurcharge ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  cabinetTypeSurchargesListPath,
  cabinetTypeSurchargesListQuery,
  defaultCabinetTypeSurchargesResponse,
  deleteCabinetTypeSurcharge,
  type CabinetTypeSurcharge,
  type CabinetTypeSurchargesResponse,
} from '../services/cabinet-type-surcharges';
import TableHelpers from '../utils/tableHelpers';

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<CabinetTypeSurchargesResponse>(cabinetTypeSurchargesListPath, {
  key: computed(() => `cabinet-type-surcharges-p${page.value}`),
  query: computed(() => cabinetTypeSurchargesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetTypeSurchargesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetTypeSurcharge>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);
const { selectedIds, hasSelection, selectionCount, isSelected, toggle, togglePage, allOnPageSelected, someOnPageSelected, clearSelection } = useTableSelection();
const bulkDeleting = ref(false);

watch(page, () => clearSelection());

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetTypeSurcharge) {
  const ok = await requestConfirm({
    title: 'Delete surcharge?',
    message: `Delete "${row.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetTypeSurcharge(row.documentId);
    await refresh();
    toast.success('Type surcharge deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete surcharge.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'surcharge' : 'surcharges';
  const ok = await requestConfirm({
    title: `Delete ${ids.length} ${noun}?`,
    message: `Permanently delete ${ids.length} selected ${noun}? This cannot be undone.`,
    confirmLabel: `Delete ${ids.length}`,
    danger: true,
  });
  if (!ok) return;
  bulkDeleting.value = true;
  let deleted = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await deleteCabinetTypeSurcharge(id);
      deleted++;
    } catch {
      failed++;
    }
  }
  bulkDeleting.value = false;
  clearSelection();
  await refresh();
  if (failed === 0) toast.success(`Deleted ${deleted} ${noun}.`);
  else toast.danger(`Deleted ${deleted} of ${ids.length} ${noun}. ${failed} failed.`);
}
</script>
