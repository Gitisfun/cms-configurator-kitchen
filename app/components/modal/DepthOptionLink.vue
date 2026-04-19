<template>
  <BaseModal
    v-model="modalOpen"
    title-id="depth-option-link-modal-title"
    title="Link depth option"
    size="wide"
    :close-disabled="linkingDocumentId !== null"
    :close-on-backdrop="linkingDocumentId === null"
    :overlay-z-index="210"
  >
    <div class="dol-modal">
      <p class="dol-modal__intro">
        Pick a depth row from the library to attach to this cabinet type. Rows already linked here are not listed.
        See all rows under
        <NuxtLink to="/depth-options" class="dol-modal__link" @click="modalOpen = false">Depth options</NuxtLink>.
      </p>
      <p v-if="cabinetTypeLabel" class="dol-modal__context">Cabinet type: <strong>{{ cabinetTypeLabel }}</strong></p>

      <div v-if="loadPending" class="dol-modal__state">
        <span class="dol-modal__spinner" aria-hidden="true" />
        <span>Loading depth options&hellip;</span>
      </div>
      <p v-else-if="loadError" class="base-modal__error">{{ loadError }}</p>
      <p v-else-if="availableRows.length === 0" class="dol-modal__empty">
        No depth options are available to link. Either every row is already linked to this type, or there are no depth
        rows in the library yet.
      </p>
      <div v-else class="dol-modal__table-wrap">
        <table class="dol-modal__table">
          <thead>
            <tr>
              <th scope="col" class="dol-modal__th dol-modal__th-name">Name</th>
              <th scope="col" class="dol-modal__th dol-modal__th-mm">Depth (mm)</th>
              <th scope="col" class="dol-modal__th dol-modal__th-act" aria-label="Link" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="opt in availableRows" :key="opt.documentId">
              <td class="dol-modal__td dol-modal__td-name">{{ opt.name }}</td>
              <td class="dol-modal__td dol-modal__td-mm">{{ opt.depth }}</td>
              <td class="dol-modal__td dol-modal__td-act">
                <BaseButton
                  type="button"
                  variant="text"
                  size="sm"
                  :disabled="linkingDocumentId !== null"
                  :loading="linkingDocumentId === opt.documentId"
                  @click="linkOption(opt)"
                >
                  Link
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="availableRows.length > 0" class="dol-modal__hint">
        The same depth row can be shared by several cabinet types; linking adds this type without removing others.
      </p>
    </div>
    <template #footer>
      <BaseButton type="button" variant="outlined" :disabled="linkingDocumentId !== null" @click="closeModal"> Close </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { getFetchErrorMessage } from '../../utils/fetchErrorMessage';
import { depthOptionLinkedToCabinetType } from '../../utils/depthOptionCabinetTypes';
import { getAllDepthOptions, updateDepthOption, type DepthOption } from '../../services/depth-options';

const emit = defineEmits<{
  linked: [];
}>();

const modalOpen = ref(false);
const cabinetTypeDocumentId = ref<string | null>(null);
const cabinetTypeLabel = ref('');
const alreadyLinkedDocumentIds = ref<Set<string>>(new Set());
const allOptions = ref<DepthOption[]>([]);
const loadPending = ref(false);
const loadError = ref('');
const linkingDocumentId = ref<string | null>(null);

const availableRows = computed(() => {
  const ctDoc = cabinetTypeDocumentId.value;
  if (!ctDoc?.trim()) return [];
  return allOptions.value.filter((opt) => {
    if (alreadyLinkedDocumentIds.value.has(opt.documentId)) return false;
    return !depthOptionLinkedToCabinetType(opt, ctDoc);
  });
});

async function loadAllPages() {
  loadPending.value = true;
  loadError.value = '';
  const pageSize = 100;
  const acc: DepthOption[] = [];
  try {
    let page = 1;
    let pageCount = 1;
    do {
      const res = await getAllDepthOptions(page, pageSize);
      acc.push(...res.data);
      pageCount = res.meta.pagination.pageCount;
      page++;
    } while (page <= pageCount);
    allOptions.value = acc;
  } catch (e: unknown) {
    loadError.value = getFetchErrorMessage(e, 'Could not load depth options.');
    allOptions.value = [];
  } finally {
    loadPending.value = false;
  }
}

async function linkOption(opt: DepthOption) {
  const ctDoc = cabinetTypeDocumentId.value;
  if (!ctDoc?.trim()) return;

  linkingDocumentId.value = opt.documentId;
  try {
    await updateDepthOption(opt.documentId, {
      connectCabinetTypeDocumentIds: [ctDoc],
    });
    modalOpen.value = false;
    emit('linked');
  } catch (e: unknown) {
    window.alert(getFetchErrorMessage(e, 'Could not link depth option.'));
  } finally {
    linkingDocumentId.value = null;
  }
}

function closeModal() {
  if (linkingDocumentId.value !== null) return;
  modalOpen.value = false;
}

/**
 * @param cabinetTypeDocumentIdArg - Strapi document id of the cabinet type
 * @param linkedDocumentIds - depth option documentIds already linked to this type (excluded from the list)
 * @param label - optional cabinet type name for context
 */
function openPicker(cabinetTypeDocumentIdArg: string, linkedDocumentIds: string[], label?: string) {
  cabinetTypeDocumentId.value = cabinetTypeDocumentIdArg.trim();
  cabinetTypeLabel.value = label?.trim() ?? '';
  alreadyLinkedDocumentIds.value = new Set(linkedDocumentIds.filter((d) => d.trim() !== ''));
  modalOpen.value = true;
  void loadAllPages();
}

watch(modalOpen, (open) => {
  if (!open) {
    cabinetTypeDocumentId.value = null;
    cabinetTypeLabel.value = '';
    alreadyLinkedDocumentIds.value = new Set();
    allOptions.value = [];
    loadError.value = '';
  }
});

defineExpose({ openPicker });
</script>

<style scoped>
.dol-modal__intro {
  margin: 0 0 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: 1.45;
}

.dol-modal__link {
  color: var(--color-brand);
  text-decoration: underline;
}

.dol-modal__context {
  margin: 0 0 1rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
}

.dol-modal__state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.dol-modal__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: dol-spin 0.7s linear infinite;
}

@keyframes dol-spin {
  to {
    transform: rotate(360deg);
  }
}

.dol-modal__empty {
  margin: 0;
  padding: 0.75rem 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.dol-modal__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--color-border);
  border-radius: var(--button-radius);
  background: var(--color-surface-card);
  max-height: min(50vh, 22rem);
  overflow-y: auto;
}

.dol-modal__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.78rem;
}

.dol-modal__th,
.dol-modal__td {
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  padding: 0.4rem 0.5rem;
  text-align: left;
  vertical-align: middle;
  background: var(--color-surface-card);
}

.dol-modal__th:last-child,
.dol-modal__td:last-child {
  border-right: none;
}

.dol-modal__table tbody tr:last-child .dol-modal__td {
  border-bottom: none;
}

.dol-modal__th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  box-shadow: 0 1px 0 var(--color-border);
}

.dol-modal__th-name {
  width: 42%;
  min-width: 8rem;
}

.dol-modal__th-mm {
  width: 5.5rem;
  text-align: right;
  white-space: nowrap;
}

.dol-modal__th-act {
  width: 1%;
  text-align: right;
  white-space: nowrap;
}

.dol-modal__td-mm {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.dol-modal__td-act {
  text-align: right;
}

.dol-modal__hint {
  margin: 0.75rem 0 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
}

.dol-modal__td-name {
  word-break: break-word;
}
</style>
