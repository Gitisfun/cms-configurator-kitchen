<template>
  <div>
    <CmsPageHeader title="Subcategories" description="Nested under a category or another subcategory. Each row belongs to exactly one parent.">
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add subcategory
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'subcategory' : 'subcategories' }}
      </template>
      <template #loading>Loading subcategories&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load subcategories.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:folder-git-2" />
        </div>
        <h3 class="base-panel__empty-title">No subcategories yet</h3>
        <p class="base-panel__empty-desc">Create Strapi &ldquo;Subcategory&rdquo; entries with a parent category or parent subcategory.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Create subcategory
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No subcategories on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Parent</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td class="base-table__image-cell">
            <div v-if="rowImageSrc(row)" class="base-table__thumb-wrap">
              <img :src="rowImageSrc(row)!" alt="" class="base-table__thumb" loading="lazy" />
            </div>
            <span v-else class="base-table__dash">—</span>
          </td>
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:folder-git-2" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td>{{ formatSubcategoryParentLine(row) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Subcategory pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalSubcategory ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { formatSubcategoryParentLine } from '../utils/subcategoryParent';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import {
  defaultSubcategoriesResponse,
  deleteSubcategory,
  subcategoriesListPath,
  subcategoriesListQuery,
  type SubcategoriesResponse,
  type Subcategory,
} from '../services/subcategories';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function rowImageSrc(row: Subcategory): string | null {
  return extractPlinthImage(row, strapiPublicUrl.value).src;
}

const { data, pending, error, refresh } = useFetch<SubcategoriesResponse>(subcategoriesListPath, {
  key: computed(() => `subcategories-p${page.value}`),
  query: computed(() => subcategoriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultSubcategoriesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<Subcategory>();
const deletingDocumentId = ref<string | null>(null);

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: Subcategory) {
  if (!window.confirm(`Delete subcategory "${row.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = row.documentId;
  try {
    await deleteSubcategory(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete subcategory.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
