<template>
  <div>
    <CmsPageHeader
      title="Settings"
      description="Configure your CMS and kitchen configurator preferences."
    />

    <div class="settings__grid">
      <div class="settings__card">
        <div class="settings__card-header">
          <Icon name="lucide:globe" class="settings__card-icon" />
          <h3 class="settings__card-title">General</h3>
        </div>
        <p class="settings__card-description">
          Site name, description, default language, and branding.
        </p>
      </div>

      <div class="settings__card">
        <div class="settings__card-header">
          <Icon name="lucide:palette" class="settings__card-icon" />
          <h3 class="settings__card-title">Appearance</h3>
        </div>
        <p class="settings__card-description">
          Theme settings, colors, typography, and the configurator's look and feel.
        </p>
      </div>

      <div class="settings__card">
        <div class="settings__card-header">
          <Icon name="lucide:database" class="settings__card-icon" />
          <h3 class="settings__card-title">API & Integrations</h3>
        </div>
        <p class="settings__card-description">
          Connect to Strapi, configure API endpoints, and manage webhooks.
        </p>
      </div>

      <div class="settings__card">
        <div class="settings__card-header">
          <Icon name="lucide:shield" class="settings__card-icon" />
          <h3 class="settings__card-title">Security</h3>
        </div>
        <p class="settings__card-description">
          Authentication methods, role-based access, and audit logs.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.settings__card {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.settings__card:hover {
  box-shadow: var(--card-shadow-hover);
  border-color: var(--color-brand);
}

.settings__card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.settings__card-icon {
  width: 20px;
  height: 20px;
  color: var(--color-brand);
}

.settings__card-title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
}

.settings__card-description {
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: var(--line-height-body);
}
</style>
