export type CrudModalExpose<T> = {
  openCreate: () => void;
  openEdit: (row: T) => void;
};

export function useModal<T>() {
  const modalRef = ref<CrudModalExpose<T> | null>(null);

  function openCreateModal() {
    modalRef.value?.openCreate();
  }

  function openEditModal(row: T) {
    modalRef.value?.openEdit(row);
  }

  return {
    modalRef,
    openCreateModal,
    openEditModal,
  };
}
