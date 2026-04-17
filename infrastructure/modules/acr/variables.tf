variable "prefix" {
  description = "Prefix added to all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment: dev, staging, or prod"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group to deploy into"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "acr_sku" {
  description = "Container Registry pricing tier: Basic, Standard, or Premium"
  type        = string
  default     = "Basic"
}

variable "aks_kubelet_principal_id" {
  description = "Object ID of the AKS kubelet identity — granted AcrPull so nodes can pull images"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
