<template>
  <NuxtLink
    :to="to"
    class="sidebar-item"
    :class="{
      'sidebar-item--active': isActive,
      'sidebar-item--collapsed': collapsed,
    }"
    :title="collapsed ? text : undefined"
  >
    <Icon :name="icon" class="sidebar-item__icon" />
    <span class="sidebar-item__label">{{ text }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string;
  icon: string;
  text: string;
  collapsed: boolean;
}>();

const route = useRoute();

const isActive = computed(() => {
  if (props.to === '/') return route.path === '/';
  return route.path === props.to || route.path.startsWith(props.to + '/');
});
</script>

<style scoped>
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
  padding: var(--sidebar-item-padding-y) var(--sidebar-item-padding-x);
  border-radius: var(--sidebar-item-radius);
  color: var(--sidebar-text-color);
  font-size: var(--sidebar-label-size);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    padding var(--sidebar-transition),
    gap var(--sidebar-transition);
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  min-width: 0;
}

.sidebar-item:hover {
  background-color: var(--sidebar-item-hover-bg);
  color: #ffffff;
}

.sidebar-item--active {
  background-color: var(--sidebar-item-active-bg);
  color: var(--sidebar-item-active-color);
}

.sidebar-item--active:hover {
  background-color: var(--sidebar-item-active-bg);
  color: var(--sidebar-item-active-color);
}

.sidebar-item__icon {
  flex-shrink: 0;
  width: var(--sidebar-icon-size);
  height: var(--sidebar-icon-size);
}

.sidebar-item__label {
  flex: 1 0 auto;
  opacity: 1;
  transition: opacity var(--sidebar-transition);
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-item--collapsed .sidebar-item__label {
  flex: 0 0 0;
  min-width: 0;
  max-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.sidebar-item--collapsed {
  justify-content: center;
  gap: 0;
  padding-left: 0;
  padding-right: 0;
}
</style>
