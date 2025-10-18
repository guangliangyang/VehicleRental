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