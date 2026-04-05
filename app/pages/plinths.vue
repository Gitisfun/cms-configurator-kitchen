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
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'plinth' : 'plinths' }}
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
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Price</th>
            <th scope="col">Color</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="p in plinths" :key="p.documentId">
          <td class="base-table__image-cell">
            <div v-if="plinthImageSrc(p)" class="base-table__thumb-wrap">
              <img :src="plinthImageSrc(p)!" alt="" class="base-table__thumb" loading="lazy" />
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
          <td>{{ formatPrice(p.price) }}</td>
          <td>{{ p.color || '—' }}</td>
          <td>{{ formatDate(p.publishedAt) }}</td>
          <td>{{ formatDate(p.updatedAt) }}</td>
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
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { defaultPlinthsResponse, deletePlinth, plinthsListPath, plinthsListQuery, type Plinth, type PlinthsResponse } from '../services/plinths';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function plinthImageSrc(p: Plinth): string | null {
  return extractPlinthImage(p, strapiPublicUrl.value).src;
}

const { data, pending, error, refresh } = useFetch<PlinthsResponse>(plinthsListPath, {
  key: computed(() => `plinths-p${page.value}`),
  query: computed(() => plinthsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultPlinthsResponse(PAGE_SIZE),
});

const plinths = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: plinthModalRef, openCreateModal, openEditModal } = useModal<Plinth>();
const deletingDocumentId = ref<string | null>(null);

async function onPlinthSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(p: Plinth) {
  if (!window.confirm(`Delete plinth "${p.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = p.documentId;
  try {
    await deletePlinth(p.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete plinth.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
