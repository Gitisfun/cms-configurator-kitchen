<template>
  <div>
    <CmsPageHeader title="Price classes" description="Define pricing tiers or levels used across the catalog.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:layers" class="base-btn__icon" />
          Add price class
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'price class' : 'price classes' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading price classes&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load price classes.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:layers" />
        </div>
        <h3 class="base-panel__empty-title">No price classes yet</h3>
        <p class="base-panel__empty-desc">Create a Strapi &ldquo;Price class&rdquo; collection type (name, level), then add entries here or in Strapi.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:layers" class="base-btn__icon" />
          Create price class
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No price classes on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(rows.map((x) => x.documentId))"
                :indeterminate="someOnPageSelected(rows.map((x) => x.documentId)) && !allOnPageSelected(rows.map((x) => x.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(rows.map((x) => x.documentId))"
              />
            </th>
            <th scope="col">Name</th>
            <th scope="col">Level</th>
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
                <Icon name="lucide:layers" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td>{{ row.level }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Price class pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalPriceClass ref="priceClassModalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  defaultPriceClassesResponse,
  deletePriceClass,
  priceClassesListPath,
  priceClassesListQuery,
  type PriceClass,
  type PriceClassesResponse,
} from '../services/price-classes';

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<PriceClassesResponse>(priceClassesListPath, {
  key: computed(() => `price-classes-p${page.value}`),
  query: computed(() => priceClassesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultPriceClassesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: priceClassModalRef, openCreateModal, openEditModal } = useModal<PriceClass>();
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

async function confirmDelete(row: PriceClass) {
  const ok = await requestConfirm({
    title: 'Delete price class?',
    message: `Delete "${row.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deletePriceClass(row.documentId);
    await refresh();
    toast.success('Price class deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete price class.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'price class' : 'price classes';
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
      await deletePriceClass(id);
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
