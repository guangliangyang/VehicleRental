output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_url" {
  description = "URL of the container registry"
  value       = azurerm_container_registry.main.login_server
}

output "api_app_url" {
  description = "HTTPS URL of the Container App API"
  value       = "https://${azurerm_container_app.api.latest_revision_fqdn}"
}

output "container_app_environment_name" {
  description = "Name of the Container App Environment"
  value       = azurerm_container_app_environment.main.name
}

output "frontend_url" {
  description = "URL of the static web app"
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "static_web_app_api_token" {
  description = "API token for Static Web App deployment"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}

output "application_insights_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}