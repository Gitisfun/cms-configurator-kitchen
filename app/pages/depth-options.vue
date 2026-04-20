<template>
  <div>
    <CmsPageHeader title="Depth Options" description="Manage depth rows used across cabinet types. Add, edit or delete options here, or link them to a cabinet type from Products.">
      <template #actions>
        <BaseButton type="button" variant="outlined" @click="goToProducts">
          <Icon name="lucide:package" class="base-btn__icon" />
          Products (catalog)
        </BaseButton>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add depth option
        </BaseButton>
      </template>
    </CmsPageHeader>

    <BasePanel :pending="pending" :error="!!error" :pagination="pagination" :empty-first-page="rows.length === 0 && page === 1" :empty-off-page="rows.length === 0 && page > 1" :item-count="rows.length" :page="page">
      <template #toolbar>
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'option' : 'options' }}
      </template>
      <template #loading>Loading depth options&hellip;</template>
      <template #error>
        <Icon name="lucide:alert-triangle" class="base-panel__alert-icon" />
        <span>Failed to load depth options.</span>
        <BaseButton type="button" variant="outlined" size="sm" @click="refresh()"> Retry </BaseButton>
      </template>
      <template #empty>
        <div class="base-panel__empty-icon">
          <Icon name="lucide:ruler" />
        </div>
        <h3 class="base-panel__empty-title">No depth options yet</h3>
        <p class="base-panel__empty-desc">Create a depth option here, then link it to one or more cabinet types from Products.</p>
        <BaseButton type="button" @click="openCreateModal">
          <Icon name="lucide:plus" class="base-btn__icon" />
          Add depth option
        </BaseButton>
      </template>
      <template #empty-offpage>
        <p class="base-panel__empty-page">No depth options on this page.</p>
        <BaseButton type="button" variant="outlined" @click="page = 1"> Back to first page </BaseButton>
      </template>

      <BaseTable>
        <template #head>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Depth</th>
            <th scope="col">Surcharge Code</th>
            <th scope="col">Surcharge Amount</th>
            <th scope="col">Default</th>
            <th scope="col">Cabinet types</th>
            <th scope="col">Published</th>
            <th scope="col">Updated</th>
            <th scope="col" class="base-table__th-actions">Actions</th>
          </tr>
        </template>
        <tr v-for="row in rows" :key="row.documentId">
          <td>
            <div class="base-table__name">
              <span class="base-table__icon">
                <Icon name="lucide:ruler" />
              </span>
              <span class="base-table__name-text">{{ row.name }}</span>
            </div>
          </td>
          <td>{{ row.depth }} mm</td>
          <td>{{ row.surchargeCode ?? '—' }}</td>
          <td>{{ formatPrice(row.surchargeAmount) }}</td>
          <td>{{ row.isDefault ? 'Yes' : 'No' }}</td>
          <td>{{ typeLabel(row) }}</td>
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
        <BasePagination v-model:page="page" :page-count="pagination!.pageCount" :disabled="pending" aria-label="Depth option pages" variant="panel" />
      </template>
    </BasePanel>

    <ModalDepthOption ref="modalRef" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import {
  depthOptionsListPath,
  depthOptionsListQuery,
  defaultDepthOptionsResponse,
  deleteDepthOption,
  type DepthOption,
  type DepthOptionsResponse,
} from '../services/depth-options';
import { formatDepthOptionCabinetTypesLabel } from '../utils/depthOptionCabinetTypes';

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<DepthOptionsResponse>(depthOptionsListPath, {
  key: computed(() => `depth-options-p${page.value}`),
  query: computed(() => depthOptionsListQuery(page.value, PAGE_SIZE)),
  default: () => defaultDepthOptionsResponse(PAGE_SIZE),
});

const rows = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const { modalRef, openCreateModal, openEditModal } = useModal<DepthOption>();
const deletingDocumentId = ref<string | null>(null);

function goToProducts() {
  void navigateTo('/products');
}

function typeLabel(row: DepthOption): string {
  return formatDepthOptionCabinetTypesLabel(row);
}

async function onSaved(payload: { resetPage: boolean }) {
  if (payload.resetPage) page.value = 1;
  await refresh();
}

async function confirmDelete(row: DepthOption) {
  if (!window.confirm(`Delete depth option "${row.name}"? This cannot be undone.`)) return;
  deletingDocumentId.value = row.documentId;
  try {
    await deleteDepthOption(row.documentId);
    await refresh();
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Failed to delete depth option.'));
  } finally {
    deletingDocumentId.value = null;
  }
}
</script>
