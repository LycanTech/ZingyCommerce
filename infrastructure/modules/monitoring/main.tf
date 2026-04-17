# ============================================================
# modules/monitoring — Log Analytics Workspace
#
# Creates a Log Analytics workspace that collects AKS control
# plane logs. The workspace ID is passed to the AKS module so
# the OMS agent can ship container logs here automatically.
# ============================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.prefix}-logs-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location

  # PerGB2018 = pay for what you ingest (~$2.76/GB)
  # First 5 GB per month is free
  sku = "PerGB2018"

  retention_in_days = var.log_retention_days

  tags = var.tags
}
