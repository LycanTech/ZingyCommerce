# ============================================================
# variables.tf — All configurable inputs
#
# Variables are like function parameters for your infrastructure.
# You set them in terraform.tfvars (never commit that file!).
# This file just DECLARES what variables exist and their defaults.
# ============================================================

variable "location" {
  description = "The Azure region to deploy resources into"
  type        = string
  default     = "eastus"

  # Common choices:
  # "eastus"        — Virginia, USA (cheapest + most services)
  # "westeurope"    — Netherlands
  # "australiaeast" — Sydney
}

variable "environment" {
  description = "Deployment environment: dev, staging, or prod"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "prefix" {
  description = "Short prefix added to all resource names (e.g. your initials or project code)"
  type        = string
  default     = "chikwex"

  validation {
    condition     = length(var.prefix) >= 3 && length(var.prefix) <= 8
    error_message = "prefix must be between 3 and 8 characters"
  }
}

variable "node_count" {
  description = "Number of Kubernetes nodes (VMs) in the cluster"
  type        = number
  default     = 2

  # Use 1 for dev (cheapest), 3 for production (high availability)
}

variable "node_vm_size" {
  description = "VM size for Kubernetes nodes"
  type        = string
  default     = "Standard_B2s"

  # Standard_B2s = 2 vCPU, 4 GB RAM — cheapest for learning
  # Standard_D2s_v3 = 2 vCPU, 8 GB RAM — better for staging/prod
}

variable "acr_sku" {
  description = "Azure Container Registry pricing tier"
  type        = string
  default     = "Basic"

  # Basic    — cheapest, no geo-replication (~$5/month)
  # Standard — webhooks, content trust (~$20/month)
  # Premium  — geo-replication, private endpoints (~$50/month)
}

variable "log_retention_days" {
  description = "How many days to keep logs in Log Analytics"
  type        = number
  default     = 30
}
