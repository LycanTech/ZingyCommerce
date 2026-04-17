output "login_server" {
  description = "ACR login server URL — used to tag and push Docker images"
  value       = azurerm_container_registry.main.login_server
}

output "acr_name" {
  description = "ACR resource name"
  value       = azurerm_container_registry.main.name
}

output "acr_id" {
  description = "ACR resource ID"
  value       = azurerm_container_registry.main.id
}
