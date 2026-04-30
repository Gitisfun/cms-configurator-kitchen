<template>
  <div ref="rootRef" class="select-custom" :class="{ 'select-custom--open': open, 'select-custom--disabled': disabled }">
    <button
      :id="id"
      type="button"
      class="select-custom__trigger"
      :class="{ 'select-custom__trigger--placeholder': !hasValue }"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <span class="select-custom__value">{{ displayText }}</span>
      <Icon name="lucide:chevron-down" class="select-custom__chevron" aria-hidden="true" />
    </button>

    <Transition name="select-custom-fade">
      <ul
        v-show="open"
        :id="listboxId"
        ref="listRef"
        class="select-custom__list"
        role="listbox"
        :aria-activedescendant="activeOptionId"
        tabindex="-1"
        @keydown="onListKeydown"
      >
        <li
          v-for="(opt, index) in options"
          :id="optionDomId(index)"
          :key="opt.value === '' ? '__empty__' : opt.value"
          role="option"
          class="select-custom__option"
          :class="{
            'select-custom__option--active': index === activeIndex,
            'select-custom__option--selected': opt.value === modelValue,
          }"
          :aria-selected="opt.value === modelValue"
          @mousedown.prevent="selectOption(opt)"
          @mouseenter="activeIndex = index"
        >
          {{ opt.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
export type SelectCustomOption = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    /** Selected option `value` (often document id). */
    modelValue: string;
    options: SelectCustomOption[];
    placeholder?: string;
    disabled?: boolean;
    /** Prefix for aria ids (must be unique on the page). */
    id?: string;
    /** Max height of the dropdown panel (scroll). */
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
    id: 'select-custom',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const activeIndex = ref(0);

const listboxId = computed(() => `${props.id}-listbox`);

const hasValue = computed(() => props.modelValue.trim() !== '');

const displayText = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  if (found) return found.label;
  return props.placeholder;
});

function optionDomId(index: number) {
  return `${props.id}-opt-${index}`;
}

const activeOptionId = computed(() => {
  if (!open.value || props.options.length === 0) return undefined;
  const i = Math.min(Math.max(activeIndex.value, 0), props.options.length - 1);
  return optionDomId(i);
});

function selectedIndex(): number {
  const i = props.options.findIndex((o) => o.value === props.modelValue);
  return i >= 0 ? i : 0;
}

function openList() {
  if (props.disabled || props.options.length === 0) return;
  activeIndex.value = selectedIndex();
  open.value = true;
  nextTick(() => {
    listRef.value?.focus();
    scrollActiveIntoView();
  });
}

function closeList() {
  open.value = false;
}

function toggleList() {
  if (open.value) closeList();
  else openList();
}

function selectOption(opt: SelectCustomOption) {
  emit('update:modelValue', opt.value);
  closeList();
}

function onTriggerClick() {
  if (props.disabled) return;
  toggleList();
}

function scrollActiveIntoView() {
  const el = document.getElementById(optionDomId(activeIndex.value));
  el?.scrollIntoView({ block: 'nearest' });
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!open.value) {
      openList();
      if (e.key === 'ArrowUp') activeIndex.value = props.options.length - 1;
      else activeIndex.value = selectedIndex();
    }
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleList();
    return;
  }
  if (e.key === 'Escape' && open.value) {
    e.preventDefault();
    closeList();
  }
}

function onListKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeList();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1);
    scrollActiveIntoView();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActiveIntoView();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const opt = props.options[activeIndex.value];
    if (opt) selectOption(opt);
    return;
  }
  if (e.key === 'Home') {
    e.preventDefault();
    activeIndex.value = 0;
    scrollActiveIntoView();
    return;
  }
  if (e.key === 'End') {
    e.preventDefault();
    activeIndex.value = props.options.length - 1;
    scrollActiveIntoView();
  }
}

function onDocumentPointerDown(e: MouseEvent) {
  if (!open.value) return;
  const root = rootRef.value;
  const t = e.target as Node;
  if (root && !root.contains(t)) closeList();
}

watch(open, (isOpen) => {
  if (import.meta.server) return;
  if (isOpen) {
    document.addEventListener('mousedown', onDocumentPointerDown);
  } else {
    document.removeEventListener('mousedown', onDocumentPointerDown);
  }
});

onUnmounted(() => {
  if (import.meta.client) document.removeEventListener('mousedown', onDocumentPointerDown);
});

watch(
  () => props.options,
  () => {
    if (activeIndex.value >= props.options.length) activeIndex.value = Math.max(0, props.options.length - 1);
  },
);

watch(
  () => props.disabled,
  (d) => {
    if (d) closeList();
  },
);
</script>

<style scoped>
.select-custom {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.select-custom--disabled {
  opacity: 0.65;
  pointer-events: none;
}

.select-custom__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--input-radius, 8px);
  font-size: var(--paragraph-size-small);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.select-custom__trigger:hover:not(:disabled) {
  border-color: var(--color-border-strong, var(--color-border-subtle));
}

.select-custom__trigger:focus {
  outline: none;
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px rgba(27, 58, 92, 0.2);
}

.select-custom--open .select-custom__trigger {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px rgba(27, 58, 92, 0.2);
}

.select-custom__trigger--placeholder .select-custom__value {
  color: var(--color-text-muted);
}

.select-custom__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-custom__chevron {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  color: var(--color-brand);
  transition: transform 0.2s ease;
}

.select-custom--open .select-custom__chevron {
  transform: rotate(180deg);
}

.select-custom__list {
  position: absolute;
  z-index: 200;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  max-height: min(280px, 40vh);
  overflow-y: auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--input-radius, 8px);
  background: var(--color-surface-card);
  box-shadow: var(--card-shadow, 0 8px 24px rgba(15, 23, 42, 0.12));
}

.select-custom__option {
  padding: 0.5rem 0.75rem;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-primary);
  cursor: pointer;
  outline: none;
}

.select-custom__option:hover,
.select-custom__option--active {
  background: var(--color-surface-hover);
}

.select-custom__option--selected {
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand);
}

.select-custom-fade-enter-active,
.select-custom-fade-leave-active {
  transition: opacity 0.12s ease;
}

.select-custom-fade-enter-from,
.select-custom-fade-leave-to {
  opacity: 0;
}
</style>
