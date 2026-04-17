output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_id" {
  description = "AKS cluster resource ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "kubelet_principal_id" {
  description = "Object ID of the AKS kubelet managed identity — used to grant AcrPull on ACR"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity federation"
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

output "connect_command" {
  description = "kubectl connection command"
  value       = "az aks get-credentials --resource-group ${azurerm_kubernetes_cluster.main.resource_group_name} --name ${azurerm_kubernetes_cluster.main.name}"
}
