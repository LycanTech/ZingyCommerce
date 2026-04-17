# ============================================================
# modules/acr — Azure Container Registry
#
# Creates the private registry and grants the AKS kubelet
# identity the AcrPull role so nodes can pull images without
# storing credentials anywhere.
# ============================================================

resource "azurerm_container_registry" "main" {
  name                = "${var.prefix}ecommerceacr${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.acr_sku

  # Managed identity auth only — no admin username/password
  admin_enabled = false

  tags = var.tags
}

# ---- Grant AKS nodes permission to pull images ----
# Without this role assignment Kubernetes gets ImagePullBackOff
# because the kubelet cannot authenticate with the registry.
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = var.aks_kubelet_principal_id
}
