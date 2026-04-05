<template>
  <div>
    <CmsPageHeader
      title="Users"
      description="Manage CMS users and their permissions."
    >
      <template #actions>
        <BaseButton type="button">
          <Icon name="lucide:user-plus" class="base-btn__icon" />
          Add User
        </BaseButton>
      </template>
    </CmsPageHeader>

    <CmsEmptyState
      icon="lucide:users"
      title="No users found"
      description="Add team members to collaborate on the kitchen configurator content."
    >
      <BaseButton type="button">
        <Icon name="lucide:user-plus" class="base-btn__icon" />
        Invite User
      </BaseButton>
    </CmsEmptyState>
  </div>
</template>
