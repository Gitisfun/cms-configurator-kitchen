<template>
  <div>
    <CmsPageHeader title="Plinths" description="Manage plinth types, pricing, and colors for kitchen configurations.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add plinth
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="plinths.length === 0 && page === 1" :empty-off-page="plinths.length === 0 && page > 1" :item-count="plinths.length" :page="page">
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'plinth' : 'plinths' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading plinths&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load plinths.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:stretch-horizontal" />
        </div>
        <h3 class="base-panel__empty-title">No plinths yet</h3>
        <p class="base-panel__empty-desc">Add your first plinth with a name. Price and color are optional.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create plinth
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No plinths on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(plinths.map((x) => x.documentId))"
                :indeterminate="someOnPageSelected(plinths.map((x) => x.documentId)) && !allOnPageSelected(plinths.map((x) => x.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(plinths.map((x) => x.documentId))"
              />
            </th>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Price</th>
            <th scope="col">Color</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="p in plinths" :key="p.documentId" :class="{ 'base-table__row--selected': isSelected(p.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(p.documentId)" :aria-label="`Select ${p.name}`" @change="toggle(p.documentId)" />
          </td>
          <td class="base-table__image-cell">
            <div v-if="TableHelpers.rowImageSrc(p, strapiPublicUrl)" class="base-table__thumb-wrap">
              <img :src="TableHelpers.rowImageSrc(p, strapiPublicUrl)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:stretch-horizontal" />
              </span>
              <span class="base-table__name-text">{{ p.name }}</span>
            </div>
          </td>
          <td>{{ TableHelpers.codeCell(p.code) }}</td>
          <td>{{ Format.priceEur(p.price) }}</td>
          <td>{{ p.color || '—' }}</td>
          <td>{{ Format.dateTime(p.publishedAt) }}</td>
          <td>{{ Format.dateTime(p.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === p.documentId" @click="openEditModal(p)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === p.documentId" @click="confirmDelete(p)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Plinth pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalPlinth ref="plinthModalRef" @saved="onPlinthSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { defaultPlinthsResponse, deletePlinth, plinthsListPath, plinthsListQuery, type Plinth, type PlinthsResponse } from '../services/plinths';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import TableHelpers from '../utils/tableHelpers';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

const { data, pending, error, refresh } = useFetch<PlinthsResponse>(plinthsListPath, {
  key: computed(() => `plinths-p${page.value}`),
  query: computed(() => plinthsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultPlinthsResponse(PAGE_SIZE),
});

const plinths = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: plinthModalRef, openCreateModal, openEditModal } = useModal<Plinth>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);
const { selectedIds, hasSelection, selectionCount, isSelected, toggle, togglePage, allOnPageSelected, someOnPageSelected, clearSelection } = useTableSelection();
const bulkDeleting = ref(false);

watch(page, () => clearSelection());

async function onPlinthSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(p: Plinth) {
  const ok = await requestConfirm({
    title: 'Delete plinth?',
    message: `Delete "${p.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = p.documentId;
  try {
    await deletePlinth(p.documentId);
    await refresh();
    toast.success('Plinth deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete plinth.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'plinth' : 'plinths';
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
      await deletePlinth(id);
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
