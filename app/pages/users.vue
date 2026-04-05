<template>
  <div>
    <CmsPageHeader
      title="Users"
      description="Manage CMS users and their permissions."
    >
      <template #actions>
        <button class="btn btn--primary">
          <Icon name="lucide:user-plus" class="btn__icon" />
          Add User
        </button>
      </template>
    </CmsPageHeader>

    <CmsEmptyState
      icon="lucide:users"
      title="No users found"
      description="Add team members to collaborate on the kitchen configurator content."
    >
      <button class="btn btn--primary">
        <Icon name="lucide:user-plus" class="btn__icon" />
        Invite User
      </button>
    </CmsEmptyState>
  </div>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--button-padding-y) var(--button-padding-x);
  border: none;
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-button);
  min-height: var(--button-min-height);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-color);
  box-shadow: var(--button-shadow);
}

.btn--primary:hover {
  background: var(--button-primary-bg-hover);
  box-shadow: var(--button-shadow-hover);
}

.btn__icon {
  width: 16px;
  height: 16px;
}
</style>
