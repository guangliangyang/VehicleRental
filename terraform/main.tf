terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
  # No backend configuration - uses local state for simplicity
}

provider "azurerm" {
  features {}

  # Use service principal authentication for CI/CD
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
  subscription_id = var.subscription_id
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  lifecycle {
    ignore_changes = [tags]
  }

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}

# Container Registry - commenting out as it already exists
# resource "azurerm_container_registry" "main" {
#   name                = var.registry_name
#   resource_group_name = azurerm_resource_group.main.name
#   location            = azurerm_resource_group.main.location
#   sku                 = "Basic"
#   admin_enabled       = true
#
#   tags = {
#     Environment = "Development"
#     Project     = "VehicleRental"
#   }
# }

# Reference existing Container Registry
data "azurerm_container_registry" "main" {
  name                = var.registry_name
  resource_group_name = azurerm_resource_group.main.name
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "plan-vehicle-rental-dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "F1"

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}

# App Service for API
resource "azurerm_linux_web_app" "api" {
  name                = "app-vehicle-rental-api-dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      docker_image_name   = "fleet-api:latest"
      docker_registry_url = "https://${data.azurerm_container_registry.main.login_server}"
    }
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL          = "https://${data.azurerm_container_registry.main.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME     = data.azurerm_container_registry.main.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD     = data.azurerm_container_registry.main.admin_password
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = false
  }

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}

# Static Web App for Frontend - commenting out as it already exists
# resource "azurerm_static_web_app" "frontend" {
#   name                = "swa-vehicle-rental-dev"
#   resource_group_name = azurerm_resource_group.main.name
#   location            = "East US 2"
#   sku_tier            = "Free"
#   sku_size            = "Free"
#
#   tags = {
#     Environment = "Development"
#     Project     = "VehicleRental"
#   }
# }

# Reference existing Static Web App
data "azurerm_static_web_app" "frontend" {
  name                = "swa-vehicle-rental-dev"
  resource_group_name = azurerm_resource_group.main.name
}

# Application Insights for monitoring - commenting out as it already exists
# resource "azurerm_application_insights" "main" {
#   name                = "appi-vehicle-rental-dev"
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
#   application_type    = "web"
#
#   tags = {
#     Environment = "Development"
#     Project     = "VehicleRental"
#   }
# }

# Reference existing Application Insights
data "azurerm_application_insights" "main" {
  name                = "appi-vehicle-rental-dev"
  resource_group_name = azurerm_resource_group.main.name
}