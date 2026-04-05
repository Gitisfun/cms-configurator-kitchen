<template>
  <div>
    <CmsPageHeader
      title="Categories"
      description="Organize products into categories and subcategories."
    >
      <template #actions>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:folder-plus" class="base-btn__icon" />
          Add Category
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel
      :pending="pending"
      :error="!!error"
      :pagination="pagination"
      :empty-first-page="categories.length === 0 && page === 1"
      :empty-off-page="categories.length === 0 && page > 1"
      :item-count="categories.length"
      :page="page"
    >
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'category' : 'categories' }}
      </template>
      <template #loading>Loading categories&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load categories.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()">
          Retry
        </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:folder-tree" />
        </div>
        <h3 class="base-panel__empty-title">No categories yet</h3>
        <p class="base-panel__empty-desc">
          Create categories in Strapi or use the API to add your first category.
        </p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:folder-plus" class="base-btn__icon" />
          Create Category
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No categories on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1">
          Back to first page
        </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="cat in categories" :key="cat.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:folder" />
              </span>
              <span class="base-table__name-text">{{ cat.name }}</span>
            </div>
          </td>
          <td>{{ formatDate(cat.publishedAt) }}</td>
          <td>{{ formatDate(cat.updatedAt) }}</td>
          <td class="base-table__actions">
            <div class="base-table__action-btns">
              <BaseButton
                type="button"
                variant="text"
                :disabled="deletingDocumentId === cat.documentId"
                @click="openEditModal(cat)"
              >
                <Icon name="lucide:pencil" class="base-btn__icon" />
                Edit
              </BaseButton>
              <BaseButton
                type="button"
                variant="text"
                danger
                :disabled="deletingDocumentId === cat.documentId"
                @click="confirmDelete(cat)"
              >
                <Icon name="lucide:trash-2" class="base-btn__icon" />
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #pagination>
        <BasePagination
          v-model:page="page"
          :page-count="pagination!.pageCount"
          :disabled="pending"
          aria-label="Category pages"
          variant="panel"
        />
      </template>
    </BasePanel>

    <ModalCategory ref="categoryModalRef" @saved="onCategorySaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  categoriesListPath,
  categoriesListQuery,
  defaultCategoriesResponse,
  deleteCategory,
  type Category,
  type CategoriesResponse,
} from '../utils/service/categories';

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<CategoriesResponse>(categoriesListPath, {
  key: computed(() => `categories-p${page.value}`),
  query: computed(() => categoriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCategoriesResponse(PAGE_SIZE),
});

const categories = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef: categoryModalRef, openCreateModal, openEditModal } = useModal<Category>();
const deletingDocumentId = ref<string | null>(null);

async function onCategorySaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(cat: Category) {
  if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = cat.documentId;
  try {
    await deleteCategory(cat.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete category.'));
  } finally {
    deletingDocumentId.value = null;
  }
}

</script>
