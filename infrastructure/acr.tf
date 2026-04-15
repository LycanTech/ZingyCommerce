# ============================================================
# acr.tf — Azure Container Registry
#
# What is ACR?
#   Like a private Docker Hub. You push your Docker images here,
#   and Kubernetes pulls them from here when deploying.
#   "Private" means only authorized users/services can access it.
# ============================================================

resource "azurerm_container_registry" "main" {
  name                = "${var.prefix}ecommerceacr${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku

  # Use managed identity (not username/password) for authentication
  # This is more secure and Azure-native
  admin_enabled = false

  tags = azurerm_resource_group.main.tags
}

# ---- Grant AKS permission to pull images from ACR ----
# Without this, Kubernetes will get "ImagePullBackOff" errors
# because it cannot authenticate with the registry.
#
# This creates a role assignment: AKS kubelet identity gets
# the "AcrPull" role on our container registry.
resource "azurerm_role_assignment" "aks_acr_pull" {
  # Scope: the ACR resource (not the whole subscription)
  scope = azurerm_container_registry.main.id

  # "AcrPull" is a built-in Azure role — allows pulling images
  role_definition_name = "AcrPull"

  # The identity that will be granted this role
  # kubelet_identity is the identity used by Kubernetes nodes
  # to pull images when starting containers
  principal_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id

  # Terraform creates this AFTER both ACR and AKS exist
  depends_on = [
    azurerm_container_registry.main,
    azurerm_kubernetes_cluster.main,
  ]
}
