<template>
  <div>
    <CmsPageHeader title="Handles" description="Manage handles with optional image, color, price, sort position, hold flag, and linked handle position.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add handle
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="handles.length === 0 && page === 1" :empty-off-page="handles.length === 0 && page > 1" :item-count="handles.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'handle' : 'handles' }}
      </template>
      <template #loading>Loading handles&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load handles.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:grip-vertical" />
        </div>
        <h3 class="base-panel__empty-title">No handles yet</h3>
        <p class="base-panel__empty-desc">Create Strapi &ldquo;Handle&rdquo; entries and link them to a handle position when needed.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create handle
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No handles on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Handle position</th>
            <th scope="col">Position</th>
            <th scope="col">Has hold</th>
            <th scope="col">Color</th>
            <th scope="col">Price</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="h in handles" :key="h.documentId">
          <td class="base-table__image-cell">
            <div v-if="handleImageSrc(h)" class="base-table__thumb-wrap">
              <img :src="handleImageSrc(h)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:grip-vertical" />
              </span>
              <span class="base-table__name-text">{{ h.name }}</span>
            </div>
          </td>
          <td>{{ handlePositionLabel(h) }}</td>
          <td>{{ h.position ?? 0 }}</td>
          <td>{{ h.hasHold ? 'Yes' : 'No' }}</td>
          <td>{{ colorLabel(h.color) }}</td>
          <td>{{ formatPrice(h.price) }}</td>
          <td>{{ formatDate(h.publishedAt) }}</td>
          <td>{{ formatDate(h.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton type="button" variant="text" :disabled="deletingDocumentId === h.documentId" @click="openEditModal(h)">
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton type="button" variant="text" danger :disabled="deletingDocumentId === h.documentId" @click="confirmDelete(h)">
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Handle pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalHandle ref="handleModalRef" @saved="onHandleSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractHandlePositionRelation } from '../utils/handlePositionRelation';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import { defaultHandlesResponse, deleteHandle, handlesListPath, handlesListQuery, type Handle, type HandlesResponse } from '../services/handles';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function handleImageSrc(h: Handle): string | null {
  return extractPlinthImage(h, strapiPublicUrl.value).src;
}

function colorLabel(color: string | null): string {
  const t = color?.trim();
  if (!t) return '—';
  return t;
}

function handlePositionLabel(h: Handle): string {
  const hp = extractHandlePositionRelation(h);
  if (!hp.name) return '—';
  return hp.name;
}

const { data, pending, error, refresh } = useFetch<HandlesResponse>(handlesListPath, {
  key: computed(() => `handles-p${page.value}`),
  query: computed(() => handlesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultHandlesResponse(PAGE_SIZE),
});

const handles = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: handleModalRef, openCreateModal, openEditModal } = useModal<Handle>();
const deletingDocumentId = ref<string | null>(null);

async function onHandleSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(h: Handle) {
  if (!window.confirm(`Delete handle "${h.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = h.documentId;
  try {
    await deleteHandle(h.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete handle.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
