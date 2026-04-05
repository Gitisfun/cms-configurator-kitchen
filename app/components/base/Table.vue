<template>
  <div class="base-table-wrap">
    <table class="base-table">
      <thead>
        <slot name="head" />
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

<style>
/* Unscoped: thead/tbody rows come from slots (parent scope), so rules must target DOM under .base-table-wrap only. */
.base-table-wrap {
  overflow-x: auto;
}

.base-table-wrap .base-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--paragraph-size-small);
}

.base-table-wrap .base-table th,
.base-table-wrap .base-table td {
  padding: 0.875rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.base-table-wrap .base-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted-strong);
  background: var(--color-surface);
  white-space: nowrap;
}

.base-table-wrap .base-table td {
  color: var(--color-text-primary);
  vertical-align: middle;
}

.base-table-wrap .base-table tbody tr:last-child td {
  border-bottom: none;
}

.base-table-wrap .base-table tbody tr:hover td {
  background: var(--color-surface-hover);
}

.base-table-wrap .base-table__name {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.base-table-wrap .base-table__name-text {
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-table-wrap .base-table__icon {
  display: flex;
  color: var(--color-brand);
  flex-shrink: 0;
}

.base-table-wrap .base-table__icon svg {
  width: 18px;
  height: 18px;
}

.base-table-wrap .base-table__th-image {
  width: 72px;
}

.base-table-wrap .base-table__image-cell {
  width: 72px;
  vertical-align: middle;
}

.base-table-wrap .base-table__thumb-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--button-radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.base-table-wrap .base-table__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.base-table-wrap .base-table__dash {
  color: var(--color-text-muted-light);
  font-size: var(--paragraph-size-small);
}

.base-table-wrap .base-table__th-actions {
  width: 1%;
  text-align: right;
}

.base-table-wrap .base-table__actions {
  text-align: right;
  white-space: nowrap;
}

.base-table-wrap .base-table__action-btns {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  flex-wrap: nowrap;
  justify-content: flex-end;
}
</style>
