variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-vehicle-rental-dev"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "registry_name" {
  description = "Name of the container registry"
  type        = string
  default     = "crvehiclerentaldev"
}

# Azure Service Principal variables for CI/CD authentication
variable "client_id" {
  description = "Azure Service Principal Client ID"
  type        = string
  sensitive   = true
}

variable "client_secret" {
  description = "Azure Service Principal Client Secret"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  sensitive   = true
}

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

# Cosmos DB configuration variables
variable "cosmos_endpoint" {
  description = "Cosmos DB endpoint URL"
  type        = string
  sensitive   = true
}

variable "cosmos_key" {
  description = "Cosmos DB primary key"
  type        = string
  sensitive   = true
}

variable "cosmos_database_id" {
  description = "Cosmos DB database ID"
  type        = string
  sensitive   = true
}

variable "cosmos_container_id" {
  description = "Cosmos DB container ID"
  type        = string
  sensitive   = true
}