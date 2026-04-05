const collapsed = ref(false);

function loadFromStorage() {
  if (import.meta.client) {
    const stored = localStorage.getItem('cms-sidebar-collapsed');
    if (stored !== null) {
      collapsed.value = stored === 'true';
    }
  }
}

function toggle() {
  collapsed.value = !collapsed.value;
  if (import.meta.client) {
    localStorage.setItem('cms-sidebar-collapsed', String(collapsed.value));
  }
}

function collapse() {
  collapsed.value = true;
  if (import.meta.client) {
    localStorage.setItem('cms-sidebar-collapsed', 'true');
  }
}

loadFromStorage();

export function useSidebar() {
  return {
    collapsed: readonly(collapsed),
    toggle,
    collapse,
  };
}
