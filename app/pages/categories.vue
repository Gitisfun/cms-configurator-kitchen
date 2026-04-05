<template>
  <div>
    <CmsPageHeader
      title="Categories"
      description="Organize products into categories and subcategories."
    >
      <template #actions>
        <button type="button" class="btn btn--primary" @click="openCreateModal">
          <Icon name="lucide:folder-plus" class="btn__icon" />
          Add Category
        </button>
      </template>
    </CmsPageHeader>

    <section class="panel">
      <div v-if="!pending && !error && pagination" class="panel__toolbar">
        <span class="panel__summary">
          {{ pagination.total }}
          {{ pagination.total === 1 ? 'category' : 'categories' }}
        </span>
      </div>

      <div v-if="pending" class="panel__loading">
        <span class="panel__spinner" />
        <span>Loading categories&hellip;</span>
      </div>

      <div v-else-if="error" class="alert alert--error">
        <Icon name="lucide:alert-triangle" class="alert__icon" />
        <span>Failed to load categories.</span>
        <button type="button" class="btn btn--outlined btn--sm" @click="refresh()">
          Retry
        </button>
      </div>

      <div
        v-else-if="categories.length === 0 && page === 1"
        class="panel__empty"
      >
        <div class="panel__empty-icon">
          <Icon name="lucide:folder-tree" />
        </div>
        <h3 class="panel__empty-title">No categories yet</h3>
        <p class="panel__empty-desc">
          Create categories in Strapi or use the API to add your first category.
        </p>
        <button type="button" class="btn btn--primary" @click="openCreateModal">
          <Icon name="lucide:folder-plus" class="btn__icon" />
          Create Category
        </button>
      </div>

      <div
        v-else-if="categories.length === 0 && page > 1"
        class="panel__empty-offpage"
      >
        <p class="panel__empty-page">No categories on this page.</p>
        <button type="button" class="btn btn--outlined" @click="page = 1">
          Back to first page
        </button>
      </div>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Published</th>
              <th scope="col">Updated</th>
              <th scope="col" class="table__th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.documentId">
              <td>
                <div class="table__name">
                  <span class="table__folder">
                    <Icon name="lucide:folder" />
                  </span>
                  <span class="table__name-text">{{ cat.name }}</span>
                </div>
              </td>
              <td>{{ formatDate(cat.publishedAt) }}</td>
              <td>{{ formatDate(cat.updatedAt) }}</td>
              <td class="table__actions">
                <div class="table__action-btns">
                  <button
                    type="button"
                    class="btn btn--text"
                    :disabled="deletingDocumentId === cat.documentId"
                    @click="openEditModal(cat)"
                  >
                    <Icon name="lucide:pencil" class="btn__icon" />
                    Edit
                  </button>
                  <button
                    type="button"
                    class="btn btn--text btn--text-danger"
                    :disabled="deletingDocumentId === cat.documentId"
                    @click="confirmDelete(cat)"
                  >
                    <Icon name="lucide:trash-2" class="btn__icon" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav
        v-if="!error && !pending && pagination && (categories.length > 0 || page > 1)"
        class="pager"
        aria-label="Category pages"
      >
        <button
          type="button"
          class="btn btn--outlined"
          :disabled="page <= 1 || pending"
          @click="page--"
        >
          <Icon name="lucide:chevron-left" class="btn__icon" />
          Previous
        </button>
        <span class="pager__info">
          Page {{ pagination.page }} of {{ pagination.pageCount }}
        </span>
        <button
          type="button"
          class="btn btn--outlined"
          :disabled="page >= pagination.pageCount || pending"
          @click="page++"
        >
          Next
          <Icon name="lucide:chevron-right" class="btn__icon" />
        </button>
      </nav>
    </section>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="modal-backdrop"
        role="presentation"
        @click.self="!formSaving && closeModal()"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="modalTitleId"
        >
          <div class="modal__header">
            <h2 :id="modalTitleId" class="modal__title">
              {{ editingCategory ? 'Edit category' : 'New category' }}
            </h2>
            <button
              type="button"
              class="modal__close"
              aria-label="Close"
              :disabled="formSaving"
              @click="closeModal"
            >
              <Icon name="lucide:x" />
            </button>
          </div>
          <form class="modal__body" @submit.prevent="submitModal">
            <label class="field">
              <span class="field__label">Name</span>
              <input
                ref="nameInputRef"
                v-model="formName"
                type="text"
                class="field__input"
                name="name"
                autocomplete="off"
                maxlength="255"
                required
                :disabled="formSaving"
              />
            </label>
            <p v-if="formError" class="modal__error">{{ formError }}</p>
            <div class="modal__footer">
              <button
                type="button"
                class="btn btn--outlined"
                :disabled="formSaving"
                @click="closeModal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn--primary" :disabled="formSaving">
                <span v-if="formSaving" class="btn__spinner" />
                {{ formSaving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Category {
  id: number;
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface CategoriesResponse {
  data: Category[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

const PAGE_SIZE = 25;
const page = ref(1);

const { data, pending, error, refresh } = useFetch<CategoriesResponse>('/api/categories', {
  key: computed(() => `categories-p${page.value}`),
  query: computed(() => ({
    'pagination[page]': page.value,
    'pagination[pageSize]': PAGE_SIZE,
  })),
  default: () => ({
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize: PAGE_SIZE,
        pageCount: 1,
        total: 0,
      },
    },
  }),
});

const categories = computed(() => data.value?.data ?? []);
const pagination = computed(() => data.value?.meta?.pagination);

const modalOpen = ref(false);
const editingCategory = ref<Category | null>(null);
const formName = ref('');
const formError = ref('');
const formSaving = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);
const modalTitleId = 'category-modal-title';
const deletingDocumentId = ref<string | null>(null);

function openCreateModal() {
  editingCategory.value = null;
  formName.value = '';
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function openEditModal(cat: Category) {
  editingCategory.value = cat;
  formName.value = cat.name;
  formError.value = '';
  modalOpen.value = true;
  nextTick(() => nameInputRef.value?.focus());
}

function closeModal() {
  if (formSaving.value) return;
  modalOpen.value = false;
  editingCategory.value = null;
  formName.value = '';
  formError.value = '';
}

async function confirmDelete(cat: Category) {
  if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) {
    return;
  }
  deletingDocumentId.value = cat.documentId;
  try {
    await $fetch(`/api/categories/${encodeURIComponent(cat.documentId)}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (e: unknown) {
    const err = e as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    const msg =
      err.data?.statusMessage
      || err.data?.message
      || err.statusMessage
      || err.message
      || 'Failed to delete category.';
    window.alert(msg);
  } finally {
    deletingDocumentId.value = null;
  }
}

async function submitModal() {
  const name = formName.value.trim();
  if (!name) {
    formError.value = 'Please enter a name.';
    return;
  }
  formError.value = '';
  formSaving.value = true;
  try {
    if (editingCategory.value) {
      await $fetch(`/api/categories/${encodeURIComponent(editingCategory.value.documentId)}`, {
        method: 'PUT',
        body: { name },
      });
    } else {
      await $fetch('/api/categories', {
        method: 'POST',
        body: { name },
      });
      page.value = 1;
    }
    formSaving.value = false;
    closeModal();
    await refresh();
  } catch (e: unknown) {
    const err = e as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    formError.value =
      err.data?.statusMessage
      || err.data?.message
      || err.statusMessage
      || err.message
      || 'Could not save category.';
  } finally {
    formSaving.value = false;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

let escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

watch(modalOpen, (open) => {
  if (import.meta.server) return;
  if (escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
    escKeyHandler = null;
  }
  if (open) {
    escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !formSaving.value) closeModal();
    };
    document.addEventListener('keydown', escKeyHandler);
  }
});

onUnmounted(() => {
  if (import.meta.client && escKeyHandler) {
    document.removeEventListener('keydown', escKeyHandler);
  }
});
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--button-padding-y) var(--button-padding-x);
  border: none;
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-button);
  min-height: var(--button-min-height);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.btn:disabled {
  opacity: var(--button-disabled-opacity);
  cursor: not-allowed;
}

.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  box-shadow: var(--button-shadow);
}

.btn--primary:hover:not(:disabled) {
  background: var(--button-primary-bg-hover);
  box-shadow: var(--button-shadow-hover);
}

.btn--outlined {
  background: var(--button-outlined-bg);
  color: var(--button-outlined-color);
  border: 1px solid var(--button-outlined-border);
}

.btn--outlined:hover:not(:disabled) {
  background: var(--button-outlined-hover-bg);
}

.btn--sm {
  min-height: 32px;
  padding: 0.375rem 0.75rem;
  font-size: 13px;
}

.btn__icon {
  width: 16px;
  height: 16px;
}

.btn--text {
  background: transparent;
  color: var(--color-brand);
  border: none;
  min-height: auto;
  padding: 0.25rem 0.5rem;
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.btn--text:hover:not(:disabled) {
  background: var(--color-success-muted);
  color: var(--color-brand-hover);
}

.btn--text-danger {
  color: var(--color-error);
}

.btn--text-danger:hover:not(:disabled) {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ---- Panel ---- */

.panel {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.panel__summary {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.panel__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-medium);
}

.panel__spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.panel__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--color-info-muted);
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.panel__empty-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.panel__empty-title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.375rem;
}

.panel__empty-desc {
  margin: 0;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: var(--line-height-body);
}

.panel__empty .btn {
  margin-top: 1.25rem;
}

.panel__empty-offpage {
  padding: 1.5rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.panel__empty-page {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-medium);
  color: var(--color-text-muted);
}

/* ---- Alert ---- */

.alert {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 1rem 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
}

.alert--error {
  background: var(--color-error-muted);
  color: var(--color-error);
}

.alert__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ---- Table ---- */

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--paragraph-size-small);
}

.table th,
.table td {
  padding: 0.875rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  background: var(--color-surface);
  white-space: nowrap;
}

.table td {
  color: var(--color-text-primary);
  vertical-align: middle;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover td {
  background: var(--color-surface-hover);
}

.table__name {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.table__folder {
  display: flex;
  color: var(--color-brand);
  flex-shrink: 0;
}

.table__folder :deep(svg) {
  width: 18px;
  height: 18px;
}

.table__name-text {
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table__th-actions {
  width: 1%;
  text-align: right;
}

.table__actions {
  text-align: right;
  white-space: nowrap;
}

.table__action-btns {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

/* ---- Modal ---- */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(27, 58, 92, 0.45);
  backdrop-filter: blur(2px);
}

.modal {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface-card);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow-hover);
  border: var(--card-border);
  outline: none;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.modal__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--header-size-medium);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-heading);
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: -0.25rem -0.25rem 0 0;
  border: none;
  border-radius: var(--button-radius);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.modal__close:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.modal__close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal__close :deep(svg) {
  width: 20px;
  height: 20px;
}

.modal__body {
  padding: 1rem 1.25rem 1.25rem;
}

.modal__error {
  margin: 0.75rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field__label {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
}

.field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  font-size: var(--paragraph-size-medium);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface-card);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field__input:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-success-muted);
}

.field__input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ---- Pager ---- */

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.25rem 1.25rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.pager__info {
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  min-width: 8rem;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
