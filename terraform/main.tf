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

# Import existing Container Registry if it exists
import {
  to = azurerm_container_registry.main
  id = "/subscriptions/f9e8a1cc-119c-4044-96ed-4bd16955be51/resourceGroups/rg-vehicle-rental-dev/providers/Microsoft.ContainerRegistry/registries/crvehiclerentaldev"
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = var.registry_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
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
      docker_registry_url = "https://${azurerm_container_registry.main.login_server}"
    }
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL          = "https://${azurerm_container_registry.main.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME     = azurerm_container_registry.main.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD     = azurerm_container_registry.main.admin_password
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = false
  }

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}

# Import existing Static Web App if it exists
import {
  to = azurerm_static_web_app.frontend
  id = "/subscriptions/f9e8a1cc-119c-4044-96ed-4bd16955be51/resourceGroups/rg-vehicle-rental-dev/providers/Microsoft.Web/staticSites/swa-vehicle-rental-dev"
}

# Static Web App for Frontend
resource "azurerm_static_web_app" "frontend" {
  name                = "swa-vehicle-rental-dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = "East US 2"
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}

# Import existing Application Insights if it exists
import {
  to = azurerm_application_insights.main
  id = "/subscriptions/f9e8a1cc-119c-4044-96ed-4bd16955be51/resourceGroups/rg-vehicle-rental-dev/providers/Microsoft.Insights/components/appi-vehicle-rental-dev"
}

# Application Insights for monitoring
resource "azurerm_application_insights" "main" {
  name                = "appi-vehicle-rental-dev"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
}