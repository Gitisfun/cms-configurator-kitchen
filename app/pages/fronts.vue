<template>
  <div>
    <CmsPageHeader title="Fronts" description="Manage cabinet fronts with images, descriptions, and linked price classes.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add front
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="fronts.length === 0 && page === 1" :empty-off-page="fronts.length === 0 && page > 1" :item-count="fronts.length" :page="page">
      <template #toolbar>
        <span class="base-panel__summary">
          <template v-if="hasSelection">{{ selectionCount }} selected</template>
          <template v-else>{{ pagination!.total }} {{ pagination!.total === 1 ? 'front' : 'fronts' }}</template>
        </span>
        <div v-if="hasSelection" class="base-panel__bulk-actions">
          <BaseButton type="button" size="sm" variant="outlined" danger :loading="bulkDeleting" @click="confirmBulkDelete">
            <Icon name="lucide:trash-2" class="base-btn__icon" />
            Delete {{ selectionCount }}
          </BaseButton>
          <BaseButton type="button" size="sm" variant="text" @click="clearSelection">Clear</BaseButton>
        </div>
      </template>
      <template #loading>Loading fronts&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load fronts.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:panels-top-left" />
        </div>
        <h3 class="base-panel__empty-title">No fronts yet</h3>
        <p class="base-panel__empty-desc">Create a Strapi &ldquo;Front&rdquo; type with name, description, image, and price class, then add entries here.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create front
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No fronts on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-select">
              <input
                type="checkbox"
                class="base-table__checkbox"
                :checked="allOnPageSelected(fronts.map((x) => x.documentId))"
                :indeterminate="someOnPageSelected(fronts.map((x) => x.documentId)) && !allOnPageSelected(fronts.map((x) => x.documentId))"
                aria-label="Select all on this page"
                @change="togglePage(fronts.map((x) => x.documentId))"
              />
            </th>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Price class</th>
            <th scope="col">Description</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="f in fronts" :key="f.documentId" :class="{ 'base-table__row--selected': isSelected(f.documentId) }">
          <td class="base-table__td-select">
            <input type="checkbox" class="base-table__checkbox" :checked="isSelected(f.documentId)" :aria-label="`Select ${f.name}`" @change="toggle(f.documentId)" />
          </td>
          <td class="base-table__image-cell">
            <div v-if="TableHelpers.rowImageSrc(f, strapiPublicUrl)" class="base-table__thumb-wrap">
              <img :src="TableHelpers.rowImageSrc(f, strapiPublicUrl)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:panels-top-left" />
              </span>
              <span class="base-table__name-text">{{ f.name }}</span>
            </div>
          </td>
          <td>{{ TableHelpers.codeCell(f.code) }}</td>
          <td>{{ TableHelpers.priceClassLabel(f) }}</td>
          <td class="fronts-page__desc">{{ TableHelpers.descriptionPreview(f.description) }}</td>
          <td>{{ Format.dateTime(f.publishedAt) }}</td>
          <td>{{ Format.dateTime(f.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === f.documentId" @click="openEditModal(f)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === f.documentId" @click="confirmDelete(f)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Front pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalFront ref="frontModalRef" @saved="onFrontSaved" />
  </div>
</template>

<script setup lang="ts">
import Format from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import { defaultFrontsResponse, deleteFront, frontsListPath, frontsListQuery, type Front, type FrontsResponse } from '../services/fronts';
import TableHelpers from '../utils/tableHelpers';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

const { data, pending, error, refresh } = useFetch<FrontsResponse>(frontsListPath, {
  key: computed(() => `fronts-p${page.value}`),
  query: computed(() => frontsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultFrontsResponse(PAGE_SIZE),
});

const fronts = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: frontModalRef, openCreateModal, openEditModal } = useModal<Front>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);
const { selectedIds, hasSelection, selectionCount, isSelected, toggle, togglePage, allOnPageSelected, someOnPageSelected, clearSelection } = useTableSelection();
const bulkDeleting = ref(false);

watch(page, () => clearSelection());

async function onFrontSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(f: Front) {
  const ok = await requestConfirm({
    title: 'Delete front?',
    message: `Delete "${f.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = f.documentId;
  try {
    await deleteFront(f.documentId);
    await refresh();
    toast.success('Front deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete front.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

async function confirmBulkDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = ids.length === 1 ? 'front' : 'fronts';
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
      await deleteFront(id);
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
.fronts-page__desc {
  max-width: 14rem;
  vertical-align: top;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted-strong);
}
</style>
