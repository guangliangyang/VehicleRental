terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformvehicle"
    container_name       = "tfstate"
    key                  = "vehicle-rental.tfstate"
  }
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

# Container Instance for API
resource "azurerm_container_group" "api" {
  name                = "ci-vehicle-rental-api-dev"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "Public"
  dns_name_label      = "vehicle-rental-api-dev"
  os_type             = "Linux"

  container {
    name   = "fleet-api"
    image  = "${azurerm_container_registry.main.login_server}/fleet-api:latest"
    cpu    = "0.5"
    memory = "1.5"

    ports {
      port     = 80
      protocol = "TCP"
    }

    environment_variables = {
      ASPNETCORE_ENVIRONMENT = "Production"
      ASPNETCORE_URLS       = "http://+:80"
    }

    secure_environment_variables = {
      DOCKER_REGISTRY_SERVER_URL      = "https://${azurerm_container_registry.main.login_server}"
      DOCKER_REGISTRY_SERVER_USERNAME = azurerm_container_registry.main.admin_username
      DOCKER_REGISTRY_SERVER_PASSWORD = azurerm_container_registry.main.admin_password
    }
  }

  image_registry_credential {
    server   = azurerm_container_registry.main.login_server
    username = azurerm_container_registry.main.admin_username
    password = azurerm_container_registry.main.admin_password
  }

  tags = {
    Environment = "Development"
    Project     = "VehicleRental"
  }
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