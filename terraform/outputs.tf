output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_url" {
  description = "URL of the container registry"
  value       = data.azurerm_container_registry.main.login_server
}

output "api_app_url" {
  description = "URL of the API app service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "frontend_url" {
  description = "URL of the static web app"
  value       = "https://${data.azurerm_static_web_app.frontend.default_host_name}"
}

output "static_web_app_api_token" {
  description = "API token for Static Web App deployment"
  value       = data.azurerm_static_web_app.frontend.api_key
  sensitive   = true
}

output "application_insights_key" {
  description = "Application Insights instrumentation key"
  value       = data.azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}