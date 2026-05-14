<template>
  <div>
    <CmsPageHeader title="Backs" description="Manage cabinet backs with optional images, color (defaults to white), and price.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add back
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="backs.length === 0 && page === 1" :empty-off-page="backs.length === 0 && page > 1" :item-count="backs.length" :page="page">
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'back' : 'backs' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading backs&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load backs.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:panel-bottom" />
        </div>
        <h3 class="base-panel__empty-title">No backs yet</h3>
        <p class="base-panel__empty-desc">Create a Strapi &ldquo;Back&rdquo; type with name, optional image, color, and price, then add entries here.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create back
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No backs on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(backs.map((b) => b.documentId))"
                :indeterminate="someOnPageSelected(backs.map((b) => b.documentId)) && !allOnPageSelected(backs.map((b) => b.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(backs.map((b) => b.documentId))"
              />
            </th>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Color</th>
            <th scope="col">Price</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="b in backs" :key="b.documentId" :class="{ 'base-table__row--selected': isSelected(b.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(b.documentId)" :aria-label="`Select ${b.name}`" @change="toggle(b.documentId)" />
          </td>
          <td class="base-table__image-cell">
            <div v-if="TableHelpers.rowImageSrc(b, strapiPublicUrl)" class="base-table__thumb-wrap">
              <img :src="TableHelpers.rowImageSrc(b, strapiPublicUrl)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:panel-bottom" />
              </span>
              <span class="base-table__name-text">{{ b.name }}</span>
            </div>
          </td>
          <td>{{ TableHelpers.codeCell(b.code) }}</td>
          <td>{{ TableHelpers.colorLabel(b.color) }}</td>
          <td>{{ Format.priceEur(b.price) }}</td>
          <td>{{ Format.dateTime(b.publishedAt) }}</td>
          <td>{{ Format.dateTime(b.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === b.documentId" @click="openEditModal(b)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === b.documentId" @click="confirmDelete(b)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Back pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalBack ref="backModalRef" @saved="onBackSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import { defaultBacksResponse, deleteBack, backsListPath, backsListQuery, type Back, type BacksResponse } from '../services/backs';
import TableHelpers from '../utils/tableHelpers';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

const { data, pending, error, refresh } = useFetch<BacksResponse>(backsListPath, {
  key: computed(() => `backs-p${page.value}`),
  query: computed(() => backsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultBacksResponse(PAGE_SIZE),
});

const backs = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: backModalRef, openCreateModal, openEditModal } = useModal<Back>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);

const { selectedIds, hasSelection, selectionCount, isSelected, toggle, togglePage, allOnPageSelected, someOnPageSelected, clearSelection } = useTableSelection();
const bulkDeleting = ref(false);

watch(page, () => clearSelection());

async function onBackSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(b: Back) {
  const ok = await requestConfirm({
    title: 'Delete back?',
    message: `Delete "${b.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = b.documentId;
  try {
    await deleteBack(b.documentId);
    await refresh();
    toast.success('Back deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete back.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'back' : 'backs';
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
      await deleteBack(id);
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
