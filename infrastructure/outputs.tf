# ============================================================
# outputs.tf — Values printed after `terraform apply`
#
# Outputs are like return values. After Terraform finishes,
# it prints these so you can copy the values into your
# pipeline variables or paste into other commands.
# ============================================================

output "resource_group_name" {
  description = "Name of the Azure resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "ACR login server URL — use this to tag and push Docker images"
  value       = azurerm_container_registry.main.login_server
  # Example: chikwexcommerceacrdev.azurecr.io
}

output "acr_name" {
  description = "ACR resource name"
  value       = azurerm_container_registry.main.name
}

output "aks_cluster_name" {
  description = "AKS cluster name — use with `az aks get-credentials`"
  value       = azurerm_kubernetes_cluster.main.name
}

output "aks_cluster_id" {
  description = "AKS cluster resource ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring queries"
  value       = azurerm_log_analytics_workspace.main.id
}

output "connect_to_aks_command" {
  description = "Copy-paste this command to connect kubectl to your cluster"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${azurerm_kubernetes_cluster.main.name}"
}

output "acr_push_example" {
  description = "Example command to push an image to ACR"
  value       = "docker build -t ${azurerm_container_registry.main.login_server}/user-service:v1 ./services/user-service && docker push ${azurerm_container_registry.main.login_server}/user-service:v1"
}
