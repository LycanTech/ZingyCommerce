# ============================================================
# main.tf — Root module
#
# Declares providers, remote state backend, and the resource
# group. Then wires together the three child modules:
#
#   monitoring  → Log Analytics workspace
#   aks         → Kubernetes cluster + diagnostic logs
#   acr         → Container registry + AcrPull role
#
# Dependency order:
#   resource_group → monitoring → aks → acr
# ============================================================

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
  }

  backend "azurerm" {
    resource_group_name  = "zcommerce-tfstate-rg"
    storage_account_name = "zcommercetfstate"
    container_name       = "tfstate"
    key                  = "zcommerce.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

provider "azuread" {}

# ---- Resource Group ----
# Created in root (not a module) because every module
# depends on it and it keeps the dependency graph simple.
resource "azurerm_resource_group" "main" {
  name     = "${var.prefix}-ecommerce-${var.environment}-rg"
  location = var.location

  tags = {
    environment = var.environment
    project     = "ecommerce-microservices"
    managed_by  = "terraform"
  }
}

# ---- Monitoring ----
module "monitoring" {
  source = "./modules/monitoring"

  prefix              = var.prefix
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  log_retention_days  = var.log_retention_days
  tags                = azurerm_resource_group.main.tags
}

# ---- AKS ----
module "aks" {
  source = "./modules/aks"

  prefix                     = var.prefix
  environment                = var.environment
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  node_count                 = var.node_count
  node_vm_size               = var.node_vm_size
  log_analytics_workspace_id = module.monitoring.workspace_id
  tags                       = azurerm_resource_group.main.tags
}

# ---- ACR ----
module "acr" {
  source = "./modules/acr"

  prefix                   = var.prefix
  environment              = var.environment
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  acr_sku                  = var.acr_sku
  aks_kubelet_principal_id = module.aks.kubelet_principal_id
  tags                     = azurerm_resource_group.main.tags
}
