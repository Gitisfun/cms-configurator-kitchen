import { ref, computed } from 'vue';

export function useTableSelection() {
  const selectedIds = ref<Set<string>>(new Set());

  const hasSelection = computed(() => selectedIds.value.size > 0);
  const selectionCount = computed(() => selectedIds.value.size);

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id);
  }

  function toggle(id: string) {
    const next = new Set(selectedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds.value = next;
  }

  function allOnPageSelected(pageIds: string[]): boolean {
    return pageIds.length > 0 && pageIds.every((id) => selectedIds.value.has(id));
  }

  function someOnPageSelected(pageIds: string[]): boolean {
    return pageIds.some((id) => selectedIds.value.has(id));
  }

  /** Toggle all items on the current page on/off. */
  function togglePage(pageIds: string[]) {
    const next = new Set(selectedIds.value);
    if (allOnPageSelected(pageIds)) {
      for (const id of pageIds) next.delete(id);
    } else {
      for (const id of pageIds) next.add(id);
    }
    selectedIds.value = next;
  }

  function clearSelection() {
    selectedIds.value = new Set();
  }

  return {
    selectedIds,
    hasSelection,
    selectionCount,
    isSelected,
    toggle,
    togglePage,
    allOnPageSelected,
    someOnPageSelected,
    clearSelection,
  };
}
