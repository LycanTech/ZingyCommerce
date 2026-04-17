# ============================================================
# modules/aks — Azure Kubernetes Service
#
# Creates the AKS cluster and wires it to Log Analytics for
# both container logs (OMS agent) and control plane audit logs
# (diagnostic setting). The kubelet identity output is consumed
# by the acr module to grant image-pull access.
# ============================================================

resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.prefix}-aks-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.prefix}-aks-${var.environment}"

  default_node_pool {
    name       = "systempool"
    node_count = var.node_count
    vm_size    = var.node_vm_size

    enable_auto_scaling = true
    min_count           = 1
    max_count           = var.node_count + 2

    # Managed OS disk — Ephemeral requires VM cache >= OS disk size (128 GB).
    os_disk_type    = "Managed"
    os_disk_size_gb = 30

    node_labels = {
      "environment" = var.environment
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  # Ships container logs and metrics to Log Analytics
  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  oidc_issuer_enabled               = true
  role_based_access_control_enabled = true

  tags = var.tags
}

# ---- AKS control plane logs → Log Analytics ----
# Captures API server, scheduler, and audit logs for debugging
# and compliance. Kept here (not in monitoring module) because
# it depends on both the cluster ID and the workspace ID.
resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "aks-diagnostics"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "kube-apiserver"
  }
  enabled_log {
    category = "kube-controller-manager"
  }
  enabled_log {
    category = "kube-scheduler"
  }
  enabled_log {
    category = "kube-audit"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
