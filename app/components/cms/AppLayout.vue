<template>
  <div class="cms-layout" :class="{ 'cms-layout--collapsed': collapsed }">
    <CmsSidebar />

    <div class="cms-layout__overlay" @click="collapse" />

    <main class="cms-layout__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { collapsed, collapse } = useSidebar();
</script>

<style scoped>
.cms-layout {
  min-height: 100vh;
}

.cms-layout__main {
  margin-left: var(--sidebar-width-expanded);
  min-height: 100vh;
  padding: var(--content-padding);
  transition: margin-left var(--sidebar-transition);
}

.cms-layout--collapsed .cms-layout__main {
  margin-left: var(--sidebar-width-collapsed);
}

.cms-layout__overlay {
  display: none;
}

/* ---- Responsive: tablet ---- */

@media (max-width: 1024px) {
  .cms-layout__main {
    padding: 1.5rem;
  }
}

/* ---- Responsive: mobile ---- */

@media (max-width: 768px) {
  .cms-layout__main {
    margin-left: 0 !important;
    padding: 1.25rem;
    padding-top: 1.25rem;
  }

  .cms-layout__overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: calc(var(--sidebar-z-index) - 1);
    cursor: pointer;
  }

  .cms-layout:not(.cms-layout--collapsed) .cms-layout__overlay {
    display: block;
  }
}
</style>
