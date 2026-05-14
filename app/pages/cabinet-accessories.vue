<template>
  <div>
    <CmsPageHeader title="Cabinet Accessories" description="Manage cabinet accessories with images, descriptions, and prices.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add accessory
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'accessory' : 'accessories' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading accessories&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load accessories.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:puzzle" />
        </div>
        <h3 class="base-panel__empty-title">No accessories yet</h3>
        <p class="base-panel__empty-desc">Create cabinet accessories and link them to cabinet types.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create accessory
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No accessories on this page.</p>
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
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Price</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId" :class="{ 'base-table__row--selected': isSelected(row.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(row.documentId)" :aria-label="`Select ${row.name}`" @change="toggle(row.documentId)" />
          </td>
          <td class="base-table__image-cell">
            <div v-if="TableHelpers.rowImageSrc(row, strapiPublicUrl)" class="base-table__thumb-wrap">
              <img :src="TableHelpers.rowImageSrc(row, strapiPublicUrl)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:puzzle" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td class="ca-page__desc">{{ TableHelpers.descriptionPreview(row.description) }}</td>
          <td>{{ Format.priceEur(row.price) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Accessory pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetAccessory ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import {
  cabinetAccessoriesListPath,
  cabinetAccessoriesListQuery,
  defaultCabinetAccessoriesResponse,
  deleteCabinetAccessory,
  type CabinetAccessory,
  type CabinetAccessoriesResponse,
} from '../services/cabinet-accessories';
import TableHelpers from '../utils/tableHelpers';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

const { data, pending, error, refresh } = useFetch<CabinetAccessoriesResponse>(cabinetAccessoriesListPath, {
  key: computed(() => `cabinet-accessories-p${page.value}`),
  query: computed(() => cabinetAccessoriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetAccessoriesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetAccessory>();
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

async function confirmDelete(row: CabinetAccessory) {
  const ok = await requestConfirm({
    title: 'Delete accessory?',
    message: `Delete "${row.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetAccessory(row.documentId);
    await refresh();
    toast.success('Accessory deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete accessory.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'accessory' : 'accessories';
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
      await deleteCabinetAccessory(id);
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

<style scoped>
.ca-page__desc {
  max-width: 14rem;
  vertical-align: top;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted-strong);
}
</style>
