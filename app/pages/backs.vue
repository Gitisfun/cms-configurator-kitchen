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
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'back' : 'backs' }}
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
        <tr v-for="b in backs" :key="b.documentId">
          <td class="base-table__image-cell">
            <div v-if="backImageSrc(b)" class="base-table__thumb-wrap">
              <img :src="backImageSrc(b)!" alt="" class="base-table__thumb" loading="lazy" />
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
          <td>{{ codeCell(b.code) }}</td>
          <td>{{ colorLabel(b.color) }}</td>
          <td>{{ formatPrice(b.price) }}</td>
          <td>{{ formatDate(b.publishedAt) }}</td>
          <td>{{ formatDate(b.updatedAt) }}</td>
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
import { formatDateTime as formatDate, formatPriceEur as formatPrice } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import { defaultBacksResponse, deleteBack, backsListPath, backsListQuery, type Back, type BacksResponse } from '../services/backs';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function backImageSrc(b: Back): string | null {
  return extractPlinthImage(b, strapiPublicUrl.value).src;
}

function colorLabel(color: string | null): string {
  const t = color?.trim();
  if (!t) return 'white';
  return t;
}

function codeCell(code: string | null | undefined): string {
  const t = code?.trim();
  return t ? t : '—';
}

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
</script>
