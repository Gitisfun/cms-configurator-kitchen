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
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'accessory' : 'accessories' }}
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
            <th scope="col" class="base-table__th-image">Image</th>
            <th scope="col">Name</th>
            <th scope="col">Description</th>
            <th scope="col">Price</th>
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
                <Icon name="lucide:puzzle" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td class="ca-page__desc">{{ descriptionPreview(row.description) }}</td>
          <td>{{ formatPrice(row.price) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Accessory pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalCabinetAccessory ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import {
  cabinetAccessoriesListPath,
  cabinetAccessoriesListQuery,
  defaultCabinetAccessoriesResponse,
  deleteCabinetAccessory,
  type CabinetAccessory,
  type CabinetAccessoriesResponse,
} from '../services/cabinet-accessories';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function imageSrc(row: CabinetAccessory): string | null {
  return extractPlinthImage(row, strapiPublicUrl.value).src;
}

function descriptionPreview(text: string | null, max = 72): string {
  if (!text) return '—';
  const t = text.trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const { data, pending, error, refresh } = useFetch<CabinetAccessoriesResponse>(cabinetAccessoriesListPath, {
  key: computed(() => `cabinet-accessories-p${page.value}`),
  query: computed(() => cabinetAccessoriesListQuery(page.value, PAGE_SIZE)),
  default: () => defaultCabinetAccessoriesResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<CabinetAccessory>();
const deletingDocumentId = ref<string | null>(null);

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: CabinetAccessory) {
  if (!window.confirm(`Delete accessory "${row.name}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteCabinetAccessory(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete accessory.'));
  } finally {
    deletingDocumentId.value = null;
  }
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
