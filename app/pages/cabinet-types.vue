<template>
  <div>
    <CmsPageHeader title="Cabinet Types" description="Manage cabinet types with images, dimensions, linked series, and subcategories.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add cabinet type
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'type' : 'types' }}
      </template>
      <template #loading>Loading cabinet types&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load cabinet types.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:layout-list" />
        </div>
        <h3 class="base-panel__empty-title">No cabinet types yet</h3>
        <p class="base-panel__empty-desc">Create cabinet types and link them to series and subcategories.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create cabinet type
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No cabinet types on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Order Prefix</th>
            <th scope="col">Series</th>
            <th scope="col">Subcategory</th>
            <th scope="col">L/R</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td class="base-table__image-cell">
            <div v-if="imageSrc(row)" class="base-table__thumb-wrap">
              <img :src="imageSrc(row)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:layout-list" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td class="ct-page__desc">{{ descriptionPreview(row.description) }}</td>
          <td>{{ row.orderNumberPrefix ?? '—' }}</td>
          <td>{{ relationName(row.cabinetSeries) }}</td>
          <td>{{ relationName(row.subcategory) }}</td>
          <td>{{ row.hasLeftRight ? 'Yes' : 'No' }}</td>
          <td>{{ formatDate(row.publishedAt) }}</td>
          <td>{{ formatDate(row.updatedAt) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Cabinet type pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetType ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import {
  cabinetTypesListPath,
  cabinetTypesListQuery,
  defaultCabinetTypesResponse,
  deleteCabinetType,
  type CabinetType,
  type CabinetTypesResponse,
} from '../services/cabinet-types';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function imageSrc(row: CabinetType): string | null {
  return extractPlinthImage(row, strapiPublicUrl.value).src;
}

function descriptionPreview(desc: string | null | undefined): string {
  if (!desc) return '—';
  const firstLine = desc.split('\n')[0].trim();
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
}

function relationName(rel: unknown): string {
  if (!rel) return '—';
  if (typeof rel === 'object' && 'name' in rel!) return (rel as { name: string }).name;
  if (typeof rel === 'object' && 'data' in rel!) {
    const d = (rel as { data: { name: string } | null }).data;
    return d?.name ?? '—';
  }
  return '—';
}

const { data, pending, error, refresh } = useFetch<CabinetTypesResponse>(cabinetTypesListPath, {
  key: computed(() => `cabinet-types-p${page.value}`),
  query: computed(() => cabinetTypesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetTypesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetType>();
const deletingDocumentId = ref<string | null>(null);

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetType) {
  if (!window.confirm(`Delete cabinet type "${row.name}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetType(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete cabinet type.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>

<style scoped>
.ct-page__desc {
  max-width: 16rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.8125rem;
}
</style>
