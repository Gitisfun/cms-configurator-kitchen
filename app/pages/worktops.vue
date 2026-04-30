<template>
  <div>
    <CmsPageHeader title="Worktops" description="Manage worktops with optional image, code, note, description, and surcharge price.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add worktop
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel
      :pending="pending"
      :error="!!error"
      :pagination="pagination"
      :empty-first-page="worktops.length === 0 && page === 1"
      :empty-off-page="worktops.length === 0 && page > 1"
      :item-count="worktops.length"
      :page="page"
    >
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'worktop' : 'worktops' }}
      </template>
      <template #loading>Loading worktops&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load worktops.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:rectangle-horizontal" />
        </div>
        <h3 class="base-panel__empty-title">No worktops yet</h3>
        <p class="base-panel__empty-desc">Create Strapi &ldquo;Worktop&rdquo; entries with a name and optional fields, then manage them here.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create worktop
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No worktops on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Code</th>
            <th scope="col">Price</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="w in worktops" :key="w.documentId">
          <td class="base-table__image-cell">
            <div v-if="worktopImageSrc(w)" class="base-table__thumb-wrap">
              <img :src="worktopImageSrc(w)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:rectangle-horizontal" />
              </span>
              <span class="base-table__name-text">{{ w.name }}</span>
            </div>
          </td>
          <td>{{ w.code?.trim() ? w.code : '—' }}</td>
          <td>{{ formatPrice(w.price) }}</td>
          <td>{{ formatDate(w.publishedAt) }}</td>
          <td>{{ formatDate(w.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === w.documentId" @click="openEditModal(w)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === w.documentId" @click="confirmDelete(w)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Worktop pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalWorktop ref="worktopModalRef" @saved="onWorktopSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import {
  defaultWorktopsResponse,
  deleteWorktop,
  worktopsListPath,
  worktopsListQuery,
  type Worktop,
  type WorktopsResponse,
} from '../services/worktops';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function worktopImageSrc(w: Worktop): string | null {
  return extractPlinthImage(w, strapiPublicUrl.value).src;
}

const { data, pending, error, refresh } = useFetch<WorktopsResponse>(worktopsListPath, {
  key: computed(() => `worktops-p${page.value}`),
  query: computed(() => worktopsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultWorktopsResponse(PAGE_SIZE),
});

const worktops = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: worktopModalRef, openCreateModal, openEditModal } = useModal<Worktop>();
const { requestConfirm } = useConfirmDialog();
const toast = useToast();
const deletingDocumentId = ref<string | null>(null);

async function onWorktopSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(w: Worktop) {
  const ok = await requestConfirm({
    title: 'Delete worktop?',
    message: `Delete "${w.name}"? This cannot be undone.`,
  });
  if (!ok) return;
  deletingDocumentId.value = w.documentId;
  try {
    await deleteWorktop(w.documentId);
    await refresh();
    toast.success('Worktop deleted.');
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Failed to delete worktop.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
