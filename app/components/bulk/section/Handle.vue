<template>
  <section class="section-preview" aria-label="Extracted handles">
    <h2 class="section-preview__title">Handles</h2>
    <p class="section-preview__desc">
      Import position diagrams into the Strapi Handle positions collection first (labels A, B, C…). Then use Import to catalog on each product group below to create Handles; "A / B / C" links to positions when names match.
    </p>

    <!-- Handle positions sub-block -->
    <div v-if="handlePositions.length > 0" class="section-preview__block">
      <div class="section-preview__head">
        <h3 class="section-preview__head-title">
          Handle positions (Strapi table)
          <span class="section-preview__count">{{ handlePositions.length }}</span>
        </h3>
        <BulkImportButton :imported="positionsImported" :importing="importingPositions" @click="runPositionsImport" />
      </div>
      <p class="section-preview__positions-meta">
        Diagrams for the handle-position reference table (not product handles). Rows that already exist in Strapi by name are skipped.
      </p>
      <ul class="section-preview__grid">
        <li
          v-for="(hp, hpi) in handlePositions"
          :key="`hp-${hpi}`"
          class="section-preview__card section-preview__card--static"
        >
          <div class="section-preview__card-media">
            <img v-if="hp.image.trim()" :src="hp.image" :alt="hp.name.trim() || 'Position'" class="section-preview__card-img" loading="lazy" />
            <div v-else class="section-preview__card-img section-preview__card-img--empty" role="img" aria-label="No image">
              <Icon name="lucide:image-off" class="section-preview__card-img-icon" />
            </div>
          </div>
          <div class="section-preview__card-body">
            <p class="section-preview__position-label">{{ hp.name.trim() || '—' }}</p>
          </div>
        </li>
      </ul>
    </div>

    <p v-if="strapiPositionsError" class="section-preview__hint section-preview__hint--error">{{ strapiPositionsError }}</p>
    <p v-else-if="strapiPositionsPending" class="section-preview__hint">Loading Strapi handle positions for import…</p>

    <!-- Handle groups -->
    <div v-for="[groupKey, rows] in byTypeAndSubtype" :key="groupKey" class="section-preview__block">
      <div class="section-preview__head">
        <h3 class="section-preview__head-title section-preview__head-title--group">
          <span class="section-preview__group-type">{{ splitKey(groupKey).type }}</span>
          <span class="section-preview__group-sep">·</span>
          <span class="section-preview__group-subtype">{{ splitKey(groupKey).subtype }}</span>
          <span class="section-preview__count">{{ rows.length }}</span>
        </h3>
        <BulkImportButton
          :imported="isGroupImported(groupKey)"
          :importing="importingGroupKey === groupKey"
          :disabled="!canImportGroups || strapiPositionsPending || !!strapiPositionsError || isGroupImported(groupKey) || importingGroupKey === groupKey"
          @click="runGroupImport(groupKey)"
        />
      </div>
      <ul class="section-preview__grid">
        <li
          v-for="(row, ri) in rows"
          :key="`han-${globalHandleIndex(groupKey, ri)}`"
          class="section-preview__card"
          role="button"
          tabindex="0"
          :aria-label="`Edit handle ${row.name.trim() || row.code || 'entry'}`"
          @click="openEditor(globalHandleIndex(groupKey, ri))"
          @keydown.enter.prevent="openEditor(globalHandleIndex(groupKey, ri))"
          @keydown.space.prevent="openEditor(globalHandleIndex(groupKey, ri))"
        >
          <div class="section-preview__card-media">
            <img v-if="row.image.trim()" :src="row.image" :alt="row.name.trim() || row.code" class="section-preview__card-img" loading="lazy" />
            <div v-else class="section-preview__card-img section-preview__card-img--empty" role="img" aria-label="No image">
              <Icon name="lucide:image-off" class="section-preview__card-img-icon" />
            </div>
          </div>
          <div class="section-preview__card-body">
            <code class="section-preview__code">{{ row.code }}</code>
            <p class="section-preview__name">{{ row.name.trim() || '—' }}</p>
            <p v-if="row.handlePostions.trim()" class="section-preview__meta">{{ row.handlePostions }}</p>
            <p v-if="row.height.trim()" class="section-preview__meta">{{ row.height }}</p>
            <p v-if="row.surcharge.trim()" class="section-preview__meta">{{ row.surcharge }}</p>
            <p v-if="row.description.trim()" class="section-preview__card-desc">{{ row.description }}</p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Import progress modal -->
    <BulkImportProgressModal
      :open="importingPositions || importingGroupKey !== null"
      :label="importingPositions ? `${handlePositions.length} handle position${handlePositions.length === 1 ? '' : 's'}` : importingGroupKey != null ? `handles · ${splitKey(importingGroupKey).type}` : undefined"
    />

    <!-- Edit modal -->
    <BaseModal v-model="editorOpen" title-id="handle-extract-editor-title" title="Edit handle (preview)" size="medium">
      <form id="handle-extract-editor-form" class="section-edit-form" @submit.prevent="saveEditor">
        <div v-if="formImage.trim()" class="section-edit-thumb-wrap">
          <img :src="formImage" alt="" class="section-edit-thumb" />
        </div>
        <BaseInputField v-model="formCode" label="Code" type="text" name="handleCode" autocomplete="off" maxlength="255" />
        <BaseInputField v-model="formName" label="Name" type="text" name="handleName" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formHandlePositions" label="Handle positions (extract)" type="text" name="handlePositionsField" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formHeight" label="Height" type="text" name="handleHeight" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formSurcharge" label="Surcharge" type="text" name="handleSurcharge" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formType" label="Type" type="text" name="handleType" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formSubtype" label="Subtype" type="text" name="handleSubtype" autocomplete="off" maxlength="255" spaced />
        <BaseInputField v-model="formDescription" label="Description" type="text" name="handleDescription" autocomplete="off" maxlength="500" spaced />
        <p class="section-edit-hint">Image comes from the PDF extract and cannot be changed here.</p>
      </form>
      <template #footer>
        <div class="section-edit-footer">
          <BaseButton type="button" variant="text" danger @click="deleteRow">Delete</BaseButton>
          <span class="section-edit-footer-spacer" />
          <BaseButton type="button" variant="outlined" @click="editorOpen = false">Cancel</BaseButton>
          <BaseButton type="submit" form="handle-extract-editor-form" variant="primary">Save</BaseButton>
        </div>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ExtractedHandleRow, ExtractedHandlePositionRow } from '~/types/bulk-import';
import type { HandlePosition } from '~/services/handle-positions';
import { createHandlePosition, fetchAllHandlePositions } from '~/services/handle-positions';
import { createHandle } from '~/services/handles';
import { parseUploadResponseId, uploadMedia } from '~/services/upload';
import { getFetchErrorMessage } from '~/utils/fetchErrorMessage';

const props = defineProps<{
  handles: ExtractedHandleRow[];
  handlePositions: ExtractedHandlePositionRow[];
}>();

const emit = defineEmits<{
  'update:handles': [value: ExtractedHandleRow[]];
  'update:handlePositions': [value: ExtractedHandlePositionRow[]];
}>();

const toast = useToast();
const { requestConfirm } = useConfirmDialog();

const GROUP_SEP = '\u0000';

const strapiPositions = ref<HandlePosition[]>([]);
const strapiPositionsPending = ref(false);
const strapiPositionsError = ref('');

const importingPositions = ref(false);
const positionsImported = ref(false);
const importingGroupKey = ref<string | null>(null);
const importedGroupKeys = ref<Set<string>>(new Set());

const canImportGroups = computed(() => importingGroupKey.value === null);

const editorOpen = ref(false);
const editorIndex = ref<number | null>(null);
const formCode = ref('');
const formName = ref('');
const formHandlePositions = ref('');
const formHeight = ref('');
const formSurcharge = ref('');
const formType = ref('');
const formSubtype = ref('');
const formDescription = ref('');
const formImage = ref('');

watch(editorOpen, (open) => { if (!open) editorIndex.value = null; });

watch(() => props.handles.length, async (n) => {
  if (n > 0 && strapiPositions.value.length === 0 && !strapiPositionsPending.value) {
    await loadStrapiPositions();
  }
}, { immediate: true });

const byTypeAndSubtype = computed(() => {
  const map = new Map<string, ExtractedHandleRow[]>();
  for (const row of props.handles) {
    const k = `${row.type.trim() || '—'}${GROUP_SEP}${row.subtype.trim() || '—'}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(row);
  }
  return [...map.entries()].sort((a, b) => {
    const ca = splitKey(a[0]);
    const cb = splitKey(b[0]);
    const cmp = ca.type.localeCompare(cb.type, undefined, { sensitivity: 'base' });
    return cmp !== 0 ? cmp : ca.subtype.localeCompare(cb.subtype, undefined, { sensitivity: 'base' });
  });
});

function splitKey(key: string): { type: string; subtype: string } {
  const i = key.indexOf(GROUP_SEP);
  if (i === -1) return { type: key || '—', subtype: '—' };
  return { type: key.slice(0, i) || '—', subtype: key.slice(i + GROUP_SEP.length) || '—' };
}

function globalHandleIndex(groupKey: string, rowIndexInGroup: number): number {
  let offset = 0;
  for (const [k, rows] of byTypeAndSubtype.value) {
    if (k === groupKey) return offset + rowIndexInGroup;
    offset += rows.length;
  }
  return -1;
}

function isGroupImported(groupKey: string): boolean {
  return importedGroupKeys.value.has(groupKey);
}

function safeBasename(prefix: string, code: string, i: number): string {
  const t = code.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
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

function parseEuropeanPrice(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const digits = t.replace(/[^\d,.-]/g, '');
  if (!digits) return undefined;
  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');
  const s = lastComma > lastDot ? digits.replace(/\./g, '').replace(',', '.') : digits.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function positionNameKey(name: string): string {
  return name.trim().toLowerCase();
}

async function loadStrapiPositions() {
  strapiPositionsPending.value = true;
  strapiPositionsError.value = '';
  try {
    strapiPositions.value = await fetchAllHandlePositions();
  } catch {
    strapiPositions.value = [];
    strapiPositionsError.value = 'Could not load handle positions. Imports match position labels (e.g. A) to Strapi by name.';
  } finally {
    strapiPositionsPending.value = false;
  }
}

function resolvePositionDocumentIds(positionsStr: string): string[] {
  const tokens = positionsStr.split(/[/|]/).map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  for (const token of tokens) {
    const key = positionNameKey(token);
    const hp = strapiPositions.value.find((p) => positionNameKey(p.name) === key);
    if (hp?.documentId) out.push(hp.documentId);
  }
  return [...new Set(out)];
}

function handleCatalogName(row: ExtractedHandleRow): string {
  let n = row.name.trim() || row.code.trim() || 'Handle';
  if (row.code.trim() && !n.includes(row.code.trim())) n = `${n} (${row.code.trim()})`;
  const desc = row.description.trim();
  if (desc) {
    const combined = `${n} — ${desc}`;
    n = combined.length <= 255 ? combined : combined.slice(0, 255);
  }
  return n;
}

async function runPositionsImport() {
  if (importingPositions.value || positionsImported.value) return;
  const rows = props.handlePositions;
  if (!rows.length) return;

  importingPositions.value = true;
  let created = 0;
  let skippedExisting = 0;
  let skippedDuplicate = 0;
  let emptyNames = 0;

  try {
    await loadStrapiPositions();
    if (strapiPositionsError.value) {
      toast.danger(strapiPositionsError.value);
      return;
    }

    const strapiKeys = new Set(strapiPositions.value.map((p) => positionNameKey(p.name)));
    const seenKeys = new Set(strapiKeys);

    for (let i = 0; i < rows.length; i++) {
      const hp = rows[i]!;
      const name = hp.name.trim();
      if (!name) { emptyNames++; continue; }
      const key = positionNameKey(name);
      if (seenKeys.has(key)) {
        if (strapiKeys.has(key)) skippedExisting++;
        else skippedDuplicate++;
        continue;
      }
      const imageId = await uploadSwatch(hp.image ?? '', safeBasename('handle-position', name, i));
      const body: Record<string, unknown> = { name };
      if (imageId != null) body.imageId = imageId;
      await createHandlePosition(body);
      seenKeys.add(key);
      created++;
    }

    const parts: string[] = [];
    if (created > 0) parts.push(`created ${created} handle position${created === 1 ? '' : 's'}`);
    if (skippedExisting > 0) parts.push(`skipped ${skippedExisting} already in catalog`);
    if (skippedDuplicate > 0) parts.push(`skipped ${skippedDuplicate} duplicate name${skippedDuplicate === 1 ? '' : 's'}`);
    if (emptyNames > 0) parts.push(`${emptyNames} row${emptyNames === 1 ? '' : 's'} had no name`);

    const summary = parts.length > 0
      ? `Handle positions: ${parts.join('; ')}.`
      : 'Handle positions: nothing new to import.';

    try {
      strapiPositions.value = await fetchAllHandlePositions();
      strapiPositionsError.value = '';
    } catch {
      // non-fatal — linking may fail on next handle group import
    }

    toast.success(summary);
    positionsImported.value = created > 0 || skippedExisting > 0 || skippedDuplicate > 0;
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, 'Handle position import failed.'));
  } finally {
    importingPositions.value = false;
  }
}

async function runGroupImport(groupKey: string) {
  if (importingGroupKey.value != null || isGroupImported(groupKey)) return;
  const rowBlock = byTypeAndSubtype.value.find(([k]) => k === groupKey);
  const rows = rowBlock?.[1] ?? [];
  if (!rows.length) return;

  importingGroupKey.value = groupKey;
  const { type, subtype } = splitKey(groupKey);
  let ok = 0;
  try {
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]!;
      const gi = globalHandleIndex(groupKey, ri);
      const name = handleCatalogName(row);
      const imageId = await uploadSwatch(row.image ?? '', safeBasename('handle', row.code, gi >= 0 ? gi : ri));
      const price = parseEuropeanPrice(row.surcharge);
      const handlePositionDocumentIds = resolvePositionDocumentIds(row.handlePostions);
      const body: Record<string, unknown> = { name, position: gi >= 0 ? gi : ri, hasHold: false };
      if (price != null) body.price = price;
      if (imageId != null) body.imageId = imageId;
      if (handlePositionDocumentIds.length) body.handlePositionDocumentIds = handlePositionDocumentIds;
      if (row.code.trim()) body.code = row.code.trim();
      if (row.handlePostions.trim()) body.handlePostions = row.handlePostions.trim();
      if (row.height.trim()) body.height = row.height.trim();
      if (row.type.trim()) body.type = row.type.trim();
      if (row.subtype.trim()) body.subtype = row.subtype.trim();
      if (row.description.trim()) body.description = row.description.trim();
      if (row.surcharge.trim()) body.surcharge = row.surcharge.trim();
      await createHandle(body);
      ok++;
    }
    importedGroupKeys.value = new Set(importedGroupKeys.value).add(groupKey);
    toast.success(`Imported ${ok} handle${ok === 1 ? '' : 's'} (${type} · ${subtype}).`);
  } catch (e: unknown) {
    toast.danger(getFetchErrorMessage(e, ok > 0 ? `Import stopped after ${ok} of ${rows.length} handles in group "${type} · ${subtype}".` : `Handle import failed for "${type} · ${subtype}".`));
  } finally {
    importingGroupKey.value = null;
  }
}

function openEditor(index: number) {
  if (index < 0) return;
  const row = props.handles[index];
  if (!row) return;
  editorIndex.value = index;
  formCode.value = row.code;
  formName.value = row.name;
  formHandlePositions.value = row.handlePostions;
  formHeight.value = row.height;
  formSurcharge.value = row.surcharge;
  formType.value = row.type;
  formSubtype.value = row.subtype;
  formDescription.value = row.description;
  formImage.value = row.image;
  editorOpen.value = true;
}

function saveEditor() {
  const idx = editorIndex.value;
  if (idx == null || idx < 0 || idx >= props.handles.length) return;
  const code = formCode.value.trim();
  const name = formName.value.trim();
  const type = formType.value.trim();
  const subtype = formSubtype.value.trim();
  if (!code && !name && !type && !subtype) return;
  const next = [...props.handles];
  next[idx] = { ...props.handles[idx]!, code, name, handlePostions: formHandlePositions.value.trim(), height: formHeight.value.trim(), surcharge: formSurcharge.value.trim(), type, subtype, description: formDescription.value.trim() };
  importedGroupKeys.value = new Set();
  positionsImported.value = false;
  emit('update:handles', next);
  editorOpen.value = false;
}

async function deleteRow() {
  const idx = editorIndex.value;
  if (idx == null || idx < 0 || idx >= props.handles.length) return;
  const row = props.handles[idx]!;
  const ok = await requestConfirm({ title: 'Remove from preview?', message: `Remove "${row.name.trim() || row.code || 'this entry'}" from the preview list?`, confirmLabel: 'Remove', danger: false });
  if (!ok) return;
  importedGroupKeys.value = new Set();
  positionsImported.value = false;
  emit('update:handles', props.handles.filter((_, i) => i !== idx));
  editorOpen.value = false;
}
</script>

<style scoped>
.section-preview { margin-top: 2rem; max-width: 1100px; }
.section-preview__title { font-family: var(--font-serif); font-size: var(--header-size-small); font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.35rem; }
.section-preview__desc { font-size: var(--paragraph-size-small); color: var(--color-text-muted); margin: 0 0 1.25rem; }
.section-preview__hint { font-size: var(--paragraph-size-small); margin-bottom: 0.5rem; color: var(--color-text-muted); }
.section-preview__hint--error { color: var(--color-danger, #b42318); }
.section-preview__positions-meta { margin: 0 0 0.75rem; font-size: var(--paragraph-size-small); color: var(--color-text-muted); }
.section-preview__block { margin-bottom: 2rem; }
.section-preview__block:last-child { margin-bottom: 0; }
.section-preview__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.65rem 1rem; margin-bottom: 0.75rem; }
.section-preview__head-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.35rem 0.5rem; margin: 0; font-size: var(--paragraph-size); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.section-preview__head-title--group { gap: 0.35rem 0.5rem; }
.section-preview__group-type { font-weight: var(--font-weight-semibold); }
.section-preview__group-sep { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
.section-preview__group-subtype { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
.section-preview__count { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; padding: 0 0.3rem; border-radius: 6px; font-size: 11px; font-weight: var(--font-weight-semibold); color: var(--color-brand); background: rgba(27, 58, 92, 0.08); }
.section-preview__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
.section-preview__card { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.65rem; border-radius: var(--card-radius); border: 1px solid var(--color-border-subtle); background: var(--color-surface-card); cursor: pointer; transition: box-shadow 0.15s ease, border-color 0.15s ease; outline: none; }
.section-preview__card:hover, .section-preview__card:focus-visible { border-color: var(--color-brand); box-shadow: 0 0 0 2px rgba(27, 58, 92, 0.1); }
.section-preview__card--static { cursor: default; }
.section-preview__card--static:hover, .section-preview__card--static:focus-visible { border-color: var(--color-border-subtle); box-shadow: none; }
.section-preview__card-media { width: 100%; aspect-ratio: 4 / 3; border-radius: 6px; overflow: hidden; background: var(--color-surface); flex-shrink: 0; }
.section-preview__card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.section-preview__card-img--empty { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
.section-preview__card-img-icon { width: 1.5rem; height: 1.5rem; opacity: 0.4; }
.section-preview__card-body { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; min-width: 0; text-align: center; }
.section-preview__position-label { margin: 0; font-size: var(--paragraph-size-small); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); text-align: center; }
.section-preview__code { display: block; width: 100%; font-size: 11px; word-break: break-word; text-align: center; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.section-preview__name { margin: 0; width: 100%; font-size: 11px; line-height: 1.35; color: var(--color-text-primary); text-align: center; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.section-preview__meta { margin: 0; font-size: 10px; line-height: 1.25; color: var(--color-text-muted); text-align: center; }
.section-preview__card-desc { margin: 0.15rem 0 0; width: 100%; font-size: 10px; line-height: 1.3; color: var(--color-text-muted); text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.section-edit-form { display: flex; flex-direction: column; }
.section-edit-thumb-wrap { margin-bottom: 1rem; display: flex; justify-content: center; }
.section-edit-thumb { max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid var(--color-border-subtle); }
.section-edit-hint { margin: 0.75rem 0 0; font-size: 12px; color: var(--color-text-muted); line-height: 1.45; }
.section-edit-footer { display: flex; align-items: center; gap: 0.5rem; }
.section-edit-footer-spacer { flex: 1; }
</style>
