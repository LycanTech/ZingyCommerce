# ============================================================
# aks.tf — Azure Kubernetes Service
#
# What is AKS?
#   AKS is Azure's managed Kubernetes service. Azure handles:
#   - The "control plane" (the brain of Kubernetes)
#   - Node OS patching and upgrades
#   - etcd (the database Kubernetes uses internally)
#
#   You only manage the "node pool" — the VMs that run your containers.
# ============================================================

resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.prefix}-aks-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # The DNS prefix is used in the cluster's API server URL
  dns_prefix = "${var.prefix}-aks-${var.environment}"

  # ---- Default Node Pool ----
  # A node pool is a group of VMs that run your containers.
  # Think of each node as a worker machine.
  default_node_pool {
    name       = "systempool"
    node_count = var.node_count
    vm_size    = var.node_vm_size

    # Auto-scaling: Kubernetes adds/removes nodes automatically
    # based on how many pods are scheduled
    enable_auto_scaling = true
    min_count           = 1
    max_count           = var.node_count + 2 # e.g. 2 → can scale to 4

    # Managed OS disk — compatible with all VM sizes including Standard_B2s.
    # Ephemeral requires the VM cache to be >= OS disk size (128 GB),
    # which Standard_B2s (32 GB cache) cannot satisfy.
    os_disk_type    = "Managed"
    os_disk_size_gb = 30

    # Each node needs enough IPs for its pods
    # /24 gives us 251 usable IPs — plenty for dev
    node_labels = {
      "environment" = var.environment
    }
  }

  # ---- Identity ----
  # SystemAssigned = Azure creates a managed identity automatically.
  # This identity is what AKS uses to interact with other Azure services.
  identity {
    type = "SystemAssigned"
  }

  # ---- Network ----
  network_profile {
    network_plugin    = "azure"    # Azure CNI: pods get real VNet IPs
    load_balancer_sku = "standard" # Standard required for production features
  }

  # ---- Monitoring ----
  # Sends container logs and metrics to Log Analytics
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # ---- OIDC Issuer ----
  # Required by AKS workload identity. Once enabled it cannot be disabled,
  # so we declare it explicitly to match the cluster's actual state.
  oidc_issuer_enabled = true

  # ---- RBAC ----
  # Role-Based Access Control: controls who can do what in the cluster
  role_based_access_control_enabled = true

  tags = azurerm_resource_group.main.tags
}
