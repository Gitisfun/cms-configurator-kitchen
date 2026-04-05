<template>
  <div class="dashboard">
    <CmsPageHeader
      title="Dashboard"
      description="Welcome back. Here's an overview of your kitchen configurator."
    />

    <div class="dashboard__stats">
      <CmsStatCard
        icon="lucide:package"
        label="Products"
        value="124"
        icon-bg="var(--color-success-muted)"
        icon-color="var(--color-success)"
      />
      <CmsStatCard
        icon="lucide:folder-tree"
        label="Categories"
        value="18"
        icon-bg="var(--color-info-muted)"
        icon-color="var(--color-info)"
      />
      <CmsStatCard
        icon="lucide:shopping-cart"
        label="Orders"
        value="56"
        icon-bg="var(--color-warning-muted)"
        icon-color="var(--color-warning)"
      />
      <CmsStatCard
        icon="lucide:users"
        label="Users"
        value="312"
        icon-bg="#f0e6f6"
        icon-color="#7c3aed"
      />
    </div>

    <div class="dashboard__grid">
      <section class="dashboard__card">
        <h2 class="dashboard__card-title">Recent Orders</h2>
        <div class="dashboard__table-wrap">
          <table class="dashboard__table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td class="dashboard__table-id">{{ order.id }}</td>
                <td>{{ order.customer }}</td>
                <td>{{ order.product }}</td>
                <td>
                  <span class="dashboard__badge" :class="`dashboard__badge--${order.status}`">
                    {{ order.statusLabel }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="dashboard__card">
        <h2 class="dashboard__card-title">Quick Actions</h2>
        <div class="dashboard__actions">
          <NuxtLink to="/products" class="dashboard__action">
            <Icon name="lucide:plus" class="dashboard__action-icon" />
            <span>Add Product</span>
          </NuxtLink>
          <NuxtLink to="/categories" class="dashboard__action">
            <Icon name="lucide:folder-plus" class="dashboard__action-icon" />
            <span>New Category</span>
          </NuxtLink>
          <NuxtLink to="/orders" class="dashboard__action">
            <Icon name="lucide:list" class="dashboard__action-icon" />
            <span>View All Orders</span>
          </NuxtLink>
          <NuxtLink to="/media" class="dashboard__action">
            <Icon name="lucide:upload" class="dashboard__action-icon" />
            <span>Upload Media</span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const recentOrders = [
  { id: '#1042', customer: 'Jan de Vries', product: 'Modern Oak Kitchen', status: 'completed', statusLabel: 'Completed' },
  { id: '#1041', customer: 'Anna Bakker', product: 'Classic White Set', status: 'processing', statusLabel: 'Processing' },
  { id: '#1040', customer: 'Peter Smit', product: 'Industrial Steel', status: 'pending', statusLabel: 'Pending' },
  { id: '#1039', customer: 'Lisa Jansen', product: 'Sage Green Cabinet', status: 'completed', statusLabel: 'Completed' },
  { id: '#1038', customer: 'Tom Visser', product: 'Noir Elegance', status: 'processing', statusLabel: 'Processing' },
];
</script>

<style scoped>
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ---- Card (shared) ---- */

.dashboard__card {
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
}

.dashboard__card-title {
  font-family: var(--font-serif);
  font-size: var(--header-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
}

/* ---- Table ---- */

.dashboard__table-wrap {
  overflow-x: auto;
}

.dashboard__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--paragraph-size-small);
}

.dashboard__table th {
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  font-size: var(--paragraph-size-small);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.625rem 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

.dashboard__table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.dashboard__table tbody tr:hover {
  background: var(--color-surface-hover);
}

.dashboard__table-id {
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-secondary);
}

/* ---- Badge ---- */

.dashboard__badge {
  display: inline-block;
  padding: 0.2rem 0.625rem;
  border-radius: 100px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
}

.dashboard__badge--completed {
  background: var(--color-success-muted);
  color: var(--color-success);
}

.dashboard__badge--processing {
  background: var(--color-info-muted);
  color: var(--color-info);
}

.dashboard__badge--pending {
  background: var(--color-warning-muted);
  color: var(--color-warning);
}

/* ---- Quick Actions ---- */

.dashboard__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dashboard__action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--button-radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--paragraph-size-small);
  font-weight: var(--font-weight-medium);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.dashboard__action:hover {
  background: var(--color-surface-card);
  border-color: var(--color-brand);
  box-shadow: var(--button-shadow);
}

.dashboard__action-icon {
  width: 18px;
  height: 18px;
  color: var(--color-brand);
}

/* ---- Responsive ---- */

@media (max-width: 1024px) {
  .dashboard__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard__stats {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
