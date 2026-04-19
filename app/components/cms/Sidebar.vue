<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__header">
      <div class="sidebar__brand">
        <Icon name="lucide:chef-hat" class="sidebar__logo-icon" />
        <span class="sidebar__brand-text">Kitchen CMS</span>
      </div>
    </div>

    <div class="sidebar__divider" />

    <nav class="sidebar__nav">
      <div class="sidebar__section">
        <span class="sidebar__section-label">Main</span>
        <CmsSidebarItem
          v-for="item in mainItems"
          :key="item.to"
          v-bind="item"
          :collapsed="collapsed"
        />
      </div>

      <div class="sidebar__section">
        <span class="sidebar__section-label">Content</span>
        <CmsSidebarItem
          v-for="item in contentItems"
          :key="item.to"
          v-bind="item"
          :collapsed="collapsed"
        />
      </div>

      <div class="sidebar__section">
        <span class="sidebar__section-label">Materials</span>
        <CmsSidebarItem
          v-for="item in materialItems"
          :key="item.to"
          v-bind="item"
          :collapsed="collapsed"
        />
      </div>

      <div class="sidebar__section">
        <span class="sidebar__section-label">Others</span>
        <CmsSidebarItem
          v-for="item in otherItems"
          :key="item.to"
          v-bind="item"
          :collapsed="collapsed"
        />
      </div>

      <div class="sidebar__section">
        <span class="sidebar__section-label">System</span>
        <CmsSidebarItem
          v-for="item in systemItems"
          :key="item.to"
          v-bind="item"
          :collapsed="collapsed"
        />
      </div>
    </nav>

    <div class="sidebar__footer">
      <button
        class="sidebar__toggle"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggle"
      >
        <Icon
          name="lucide:panel-left-close"
          class="sidebar__toggle-icon"
          :class="{ 'sidebar__toggle-icon--flipped': collapsed }"
        />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { collapsed, toggle } = useSidebar();

const mainItems = [
  { to: '/', icon: 'lucide:layout-dashboard', text: 'Dashboard' },
  { to: '/orders', icon: 'lucide:shopping-cart', text: 'Orders' },
];

const contentItems = [
  { to: '/categories', icon: 'lucide:folder-tree', text: 'Categories' },
  { to: '/subcategories', icon: 'lucide:folder-git-2', text: 'Subcategories' },
  { to: '/products', icon: 'lucide:package', text: 'Products' },
  { to: '/cabinet-accessories', icon: 'lucide:puzzle', text: 'Accessories' },
];

const materialItems = [
  { to: '/fronts', icon: 'lucide:panels-top-left', text: 'Fronts' },
  { to: '/backs', icon: 'lucide:panel-bottom', text: 'Backs' },
  { to: '/handles', icon: 'lucide:grip-vertical', text: 'Handles' },
  { to: '/plinths', icon: 'lucide:stretch-horizontal', text: 'Plinths' },
];

const otherItems = [
  { to: '/media', icon: 'lucide:image', text: 'Media' },
  { to: '/cabinet-type-surcharges', icon: 'lucide:percent', text: 'Surcharges' },
  { to: '/depth-options', icon: 'lucide:ruler', text: 'Depth options' },
  { to: '/handle-positions', icon: 'lucide:crosshair', text: 'Handle positions' },
];

const systemItems = [
  { to: '/users', icon: 'lucide:users', text: 'Users' },
  { to: '/settings', icon: 'lucide:settings', text: 'Settings' },
];
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width-expanded);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  z-index: var(--sidebar-z-index);
  transition: width var(--sidebar-transition);
  overflow: hidden;
}

.sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
}

/* ---- Header ---- */

.sidebar__header {
  padding: var(--sidebar-header-padding);
  display: flex;
  align-items: center;
  min-height: 64px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  white-space: nowrap;
  transition: gap var(--sidebar-transition);
}

.sidebar--collapsed .sidebar__brand {
  gap: 0;
}

.sidebar__logo-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--sidebar-item-active-color);
}

.sidebar__brand-text {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: var(--letter-spacing-tight);
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar--collapsed .sidebar__brand-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
  pointer-events: none;
}

.sidebar--collapsed .sidebar__header {
  justify-content: center;
}

/* ---- Divider ---- */

.sidebar__divider {
  height: 1px;
  background: var(--sidebar-divider);
  margin: 0 var(--sidebar-header-padding);
}

.sidebar--collapsed .sidebar__divider {
  margin: 0 0.75rem;
}

/* ---- Nav ---- */

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-item-gap);
}

.sidebar__section-label {
  font-size: var(--sidebar-section-label-size);
  font-weight: var(--font-weight-semibold);
  color: var(--sidebar-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.375rem var(--sidebar-item-padding-x);
  overflow: hidden;
  white-space: nowrap;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
}

.sidebar--collapsed .sidebar__section-label {
  opacity: 0;
  height: 0;
  padding: 0;
  margin: 0;
}

/* ---- Footer / Toggle ---- */

.sidebar__footer {
  padding: 0.75rem;
  border-top: 1px solid var(--sidebar-divider);
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--sidebar-item-padding-y) var(--sidebar-item-padding-x);
  border: none;
  border-radius: var(--sidebar-item-radius);
  background: transparent;
  color: var(--sidebar-text-muted);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.sidebar__toggle:hover {
  background: var(--sidebar-item-hover-bg);
  color: #ffffff;
}

.sidebar__toggle-icon {
  width: var(--sidebar-icon-size);
  height: var(--sidebar-icon-size);
  transition: transform var(--sidebar-transition);
}

.sidebar__toggle-icon--flipped {
  transform: rotate(180deg);
}

/* ---- Scrollbar ---- */

.sidebar__nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar__nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
</style>
