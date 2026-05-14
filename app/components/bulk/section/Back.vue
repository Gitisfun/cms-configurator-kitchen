<template>
  <section class="section-preview" aria-label="Extracted backs">
    <h2 class="section-preview__title">Backs</h2>
    <p class="section-preview__desc">{{ modelValue.length }} row{{ modelValue.length === 1 ? '' : 's' }} from the PDF extract. Click a card to edit code or name, or remove it from the list. Use Import to catalog to create backs in Strapi.</p>

    <div class="section-preview__head">
      <h3 class="section-preview__head-title">
        Preview <span class="section-preview__count">{{ modelValue.length }}</span>
      </h3>
      <BulkImportButton :imported="imported" :importing="importing" @click="runImport" />
    </div>

    <ul class="section-preview__grid">
      <li v-for="(row, bi) in modelValue" :key="`b-${bi}`" class="section-preview__card" role="button" tabindex="0" :aria-label="`Edit back ${row.name.trim() || row.code || 'entry'}`" @click="openEditor(bi)" @keydown.enter.prevent="openEditor(bi)" @keydown.space.prevent="openEditor(bi)">
        <div class="section-preview__card-media">
          <img v-if="row.image.trim()" :src="row.image" :alt="row.name.trim() || row.code" class="section-preview__card-img" loading="lazy" />
          <div v-else class="section-preview__card-img section-preview__card-img--empty" role="img" aria-label="No image">
            <Icon name="lucide:image-off" class="section-preview__card-img-icon" />
          </div>
        </div>
        <div class="section-preview__card-body">
          <code class="section-preview__code">{{ row.code }}</code>
          <p class="section-preview__name">{{ row.name.trim() || '—' }}</p>
        </div>
      </li>
    </ul>

    <BulkImportProgressModal :open="importing" :label="`${modelValue.length} back${modelValue.length === 1 ? '' : 's'}`" />

    <BaseModal v-model="editorOpen" title-id="back-extract-editor-title" title="Edit back (preview)" size="medium">
      <form id="back-extract-editor-form" class="section-edit-form" @submit.prevent="saveEditor">
        <div v-if="formImage.trim()" class="section-edit-thumb-wrap">
          <img :src="formImage" alt="" class="section-edit-thumb" />
        </div>
        <BaseInputField v-model="formCode" label="Code" type="text" name="backCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="formName" label="Name" type="text" name="backName" autocomplete="off" maxlength="255" spaced />
        <p class="section-edit-hint">Image comes from the PDF extract and cannot be changed here. Delete this row and re-upload the PDF if the swatch is wrong.</p>
      </form>
      <template #footer>
        <div class="section-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteRow">Delete</BaseButton>
          <span class="section-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="editorOpen = false">Cancel</BaseButton>
          <BaseButton type="submit" form="back-extract-editor-form" variant="primary">Save</BaseButton>
        </div>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ExtractedBackRow } from '~/types/bulk-import';
import { createBack } from '~/services/backs';
import { parseUploadResponseId, uploadMedia } from '~/services/upload';
import { getFetchErrorMessage } from '~/utils/fetchErrorMessage';

const props = defineProps<{ modelValue: ExtractedBackRow[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: ExtractedBackRow[]] }>();

const toast = useToast();
const { requestConfirm } = useConfirmDialog();

const importing = ref(false);
const imported = ref(false);

const editorOpen = ref(false);
const editorIndex = ref<number | null>(null);
const formCode = ref('');
const formName = ref('');
const formImage = ref('');

watch(editorOpen, (open) => {
  if (!open) editorIndex.value = null;
});

function safeBasename(prefix: string, code: string, i: number): string {
  const t = code
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return t || `${prefix}-${i}`;
}

async function uploadSwatch(imageSrc: string, basename: string): Promise<number | undefined> {
  const src = imageSrc?.trim();
  if (!src || !src.startsWith('data:')) return undefined;
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not read swatch image for upload.');
  const blob = await res.blob();
  const fd = new FormData();
  fd.append('file', blob, `${basename}.png`);
  const raw = await uploadMedia(fd);
  const parsed = parseUploadResponseId(raw);
  if (!parsed?.id) throw new Error('Upload succeeded but no media id was returned.');
  return parsed.id;
}

async function runImport() {
  if (importing.value || imported.value) return;
  const rows = props.modelValue;
  if (!rows.length) return;

  importing.value = true;
  let ok = 0;
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const name = row.name.trim() || row.code.trim() || `Back ${i + 1}`;
      const imageId = await uploadSwatch(row.image ?? '', safeBasename('back', row.code, i));
      const body: Record<string, unknown> = { name };
      if (row.code.trim()) body.code = row.code.trim();
      if (imageId != null) body.imageId = imageId;
      await createBack(body);
      ok++;
    }
    imported.value = true;
    toast.success(`Imported ${ok} back${ok === 1 ? '' : 's'} to the catalog.`);
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, ok > 0 ? `Import stopped after ${ok} of ${rows.length} backs.` : 'Back import failed.'));
  } finally {
    importing.value = false;
  }
}

function openEditor(index: number) {
  const row = props.modelValue[index];
  if (!row) return;
  editorIndex.value = index;
  formCode.value = row.code;
  formName.value = row.name;
  formImage.value = row.image;
  editorOpen.value = true;
}

function saveEditor() {
  const idx = editorIndex.value;
  if (idx == null || idx < 0 || idx >= props.modelValue.length) return;
  const code = formCode.value.trim();
  const name = formName.value.trim();
  if (!code && !name) return;
  const next = [...props.modelValue];
  next[idx] = { ...props.modelValue[idx]!, code, name };
  imported.value = false;
  emit('update:modelValue', next);
  editorOpen.value = false;
}

async function deleteRow() {
  const idx = editorIndex.value;
  if (idx == null || idx < 0 || idx >= props.modelValue.length) return;
  const row = props.modelValue[idx]!;
  const ok = await requestConfirm({
    title: 'Remove from preview?',
    message: `Remove "${row.name.trim() || row.code || 'this entry'}" from the preview list?`,
    confirmLabel: 'Remove',
    danger: false,
  });
  if (!ok) return;
  imported.value = false;
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== idx),
  );
  editorOpen.value = false;
}
</script>

<style scoped>
.section-preview {
  margin-top: 2rem;
  max-width: 1100px;
}
.section-preview__title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 0.35rem;
}
.section-preview__desc {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}
.section-preview__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  margin-bottom: 0.75rem;
}
.section-preview__head-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
  margin: 0;
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.section-preview__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.3rem;
  border-radius: 6px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand);
  background: rgba(27, 58, 92, 0.08);
}
.section-preview__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}
.section-preview__card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.65rem;
  border-radius: var(--card-radius);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-card);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  outline: none;
}
.section-preview__card:hover,
.section-preview__card:focus-visible {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px rgba(27, 58, 92, 0.1);
}
.section-preview__card-media {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-surface);
  flex-shrink: 0;
}
.section-preview__card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.section-preview__card-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
.section-preview__card-img-icon {
  width: 1.5rem;
  height: 1.5rem;
  opacity: 0.4;
}
.section-preview__card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  text-align: center;
}
.section-preview__code {
  display: block;
  width: 100%;
  font-size: 11px;
  word-break: break-word;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.section-preview__name {
  margin: 0;
  width: 100%;
  font-size: 11px;
  line-height: 1.35;
  color: var(--color-text-primary);
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.section-edit-form {
  display: flex;
  flex-direction: column;
}
.section-edit-thumb-wrap {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}
.section-edit-thumb {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
}
.section-edit-hint {
  margin: 0.75rem 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
}
.section-edit-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-edit-footer-spacer {
  flex: 1;
}
</style>
