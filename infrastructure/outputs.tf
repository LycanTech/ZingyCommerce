# ============================================================
# outputs.tf — Root module outputs
#
# All values come from child module outputs.
# Printed after `terraform apply` and readable via
# `terraform output <name>`.
# ============================================================

output "resource_group_name" {
  description = "Name of the Azure resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "ACR login server URL — use this to tag and push Docker images"
  value       = module.acr.login_server
}

output "acr_name" {
  description = "ACR resource name"
  value       = module.acr.acr_name
}

output "aks_cluster_name" {
  description = "AKS cluster name — use with az aks get-credentials"
  value       = module.aks.cluster_name
}

output "aks_cluster_id" {
  description = "AKS cluster resource ID"
  value       = module.aks.cluster_id
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring queries"
  value       = module.monitoring.workspace_id
}

output "connect_to_aks_command" {
  description = "Copy-paste this command to connect kubectl to your cluster"
  value       = module.aks.connect_command
}

output "acr_push_example" {
  description = "Example command to push an image to ACR"
  value       = "docker build -t ${module.acr.login_server}/user-service:v1 ./services/user-service && docker push ${module.acr.login_server}/user-service:v1"
}
