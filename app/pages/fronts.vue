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
        {{ pagination!.total }}
        {{ pagination!.total === 1 ? 'front' : 'fronts' }}
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
        <tr v-for="f in fronts" :key="f.documentId">
          <td class="base-table__image-cell">
            <div v-if="frontImageSrc(f)" class="base-table__thumb-wrap">
              <img :src="frontImageSrc(f)!" alt="" class="base-table__thumb" loading="lazy" />
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
          <td>{{ codeCell(f.code) }}</td>
          <td>{{ priceClassLabel(f) }}</td>
          <td class="fronts-page__desc">{{ descriptionPreview(f.description) }}</td>
          <td>{{ formatDate(f.publishedAt) }}</td>
          <td>{{ formatDate(f.updatedAt) }}</td>
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
import { formatDateTime as formatDate } from '../utils/format';
import { getFetchErrorMessage } from '../utils/fetchErrorMessage';
import { extractFrontPriceClass } from '../utils/frontPriceClass';
import { extractPlinthImage } from '../utils/plinthImage';
import { useStrapiPublicUrl } from '../utils/strapiPublicUrl';
import { defaultFrontsResponse, deleteFront, frontsListPath, frontsListQuery, type Front, type FrontsResponse } from '../services/fronts';

const PAGE_SIZE = 25;
const page = ref(1);

const strapiPublicUrl = useStrapiPublicUrl();

function frontImageSrc(f: Front): string | null {
  return extractPlinthImage(f, strapiPublicUrl.value).src;
}

function priceClassLabel(f: Front): string {
  const pc = extractFrontPriceClass(f);
  if (!pc.name) return '—';
  if (pc.level != null) return `${pc.name} (${pc.level})`;
  return pc.name;
}

function codeCell(code: string | null | undefined): string {
  const t = code?.trim();
  return t ? t : '—';
}

function descriptionPreview(text: string | null, max = 72): string {
  if (!text) return '—';
  const t = text.trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

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
</script>

<style scoped>
.fronts-page__desc {
  max-width: 14rem;
  vertical-align: top;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted-strong);
}
</style>
