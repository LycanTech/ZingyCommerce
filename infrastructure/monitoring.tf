# ============================================================
# monitoring.tf — Log Analytics Workspace
#
# What is Log Analytics?
#   A workspace that collects and stores logs from all your
#   Azure resources. You can query logs using KQL (Kusto Query
#   Language) to debug issues or build dashboards.
#
# How it connects:
#   AKS → sends logs to → Log Analytics Workspace
#   You → query logs from → Azure Portal or CLI
# ============================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.prefix}-logs-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  # PerGB2018 = pay for what you ingest (~$2.76/GB)
  # Free tier: first 5 GB per month is free
  sku = "PerGB2018"

  # How many days to keep logs (30 = free retention tier)
  retention_in_days = var.log_retention_days

  tags = azurerm_resource_group.main.tags
}

# ---- Connect AKS to the Workspace ----
# This diagnostic setting forwards AKS control plane logs
# (API server, scheduler, etc.) to Log Analytics
resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "aks-diagnostics"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Forward these log categories to Log Analytics:
  enabled_log {
    category = "kube-apiserver" # API server logs
  }
  enabled_log {
    category = "kube-controller-manager"
  }
  enabled_log {
    category = "kube-scheduler"
  }
  enabled_log {
    category = "kube-audit" # Who did what (audit trail)
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
