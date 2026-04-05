<template>
  <div class="stat-card">
    <div class="stat-card__icon-wrap" :style="{ background: iconBg }">
      <Icon :name="icon" class="stat-card__icon" :style="{ color: iconColor }" />
    </div>
    <div class="stat-card__content">
      <span class="stat-card__label">{{ label }}</span>
      <span class="stat-card__value">{{ value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
}>();
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: var(--card-padding);
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.stat-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}

.stat-card__icon {
  width: 22px;
  height: 22px;
}

.stat-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.stat-card__label {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-wide);
}

.stat-card__value {
  font-size: 22px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.2;
}
</style>
