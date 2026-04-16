# ============================================================
# main.tf — Provider Configuration & Resource Group
#
# What is Terraform?
#   Terraform is a tool that lets you describe your cloud
#   infrastructure in code (.tf files). You run `terraform apply`
#   and Terraform figures out what to CREATE, UPDATE, or DELETE
#   in Azure to match what you described.
#
# Why Terraform over Bicep?
#   - Works across multiple clouds (Azure, AWS, GCP)
#   - Larger community and ecosystem
#   - terraform plan shows you EXACTLY what will change
#     before anything is touched — great for safety
#   - State file tracks what Terraform has already created
#
# Files in this folder:
#   main.tf          — providers, resource group, backend
#   variables.tf     — all configurable inputs
#   outputs.tf       — values printed after deployment
#   acr.tf           — Azure Container Registry
#   aks.tf           — Azure Kubernetes Service
#   monitoring.tf    — Log Analytics Workspace
#   terraform.tfvars — YOUR values (not committed to Git)
# ============================================================

# ---- Terraform Settings ----
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

  # ---- Remote State Backend ----
  # Terraform keeps a "state file" that tracks what it created.
  # Storing it in Azure Blob Storage means your whole team shares
  # the same state, and it's backed up safely.
  #
  # Create the storage account ONCE manually (before terraform init):
  #   az group create --name tfstate-rg --location eastus
  #   az storage account create \
  #     --name <UNIQUE_NAME>tfstate \
  #     --resource-group tfstate-rg \
  #     --location eastus \
  #     --sku Standard_LRS
  #   az storage container create \
  #     --name tfstate \
  #     --account-name <UNIQUE_NAME>tfstate
  #
  # Then fill in the values below:
  backend "azurerm" {
    resource_group_name  = "zcommerce-tfstate-rg"
    storage_account_name = "zcommercetfstate"
    container_name       = "tfstate"
    key                  = "zcommerce.terraform.tfstate"
  }
}

# ---- Azure Provider ----
# This tells Terraform to talk to Azure.
# Authentication uses your `az login` session automatically.
provider "azurerm" {
  features {
    resource_group {
      # Safety net: Terraform won't delete a resource group
      # unless every resource inside it has already been deleted
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
# A resource group is like a folder in Azure.
# Every resource we create goes inside this folder.
resource "azurerm_resource_group" "main" {
  name     = "${var.prefix}-ecommerce-${var.environment}-rg"
  location = var.location

  tags = {
    environment = var.environment
    project     = "ecommerce-microservices"
    managed_by  = "terraform"
  }
}
