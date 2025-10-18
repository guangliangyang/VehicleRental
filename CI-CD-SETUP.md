# CI/CD Setup Guide

This document explains how to set up the CI/CD pipeline for the Vehicle Rental System.

## Prerequisites

1. **Azure Account** with active subscription
2. **GitHub Repository** with admin access
3. **Azure CLI** installed locally
4. **Terraform** 1.6+ installed locally

## Setup Steps

### 1. Create Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac --name "sp-vehicle-rental-cicd" \
  --role="Contributor" \
  --scopes="/subscriptions/{subscription-id}" \
  --sdk-auth
```

Save the output JSON - you'll need it for GitHub secrets.

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these repository secrets:

```
AZURE_CREDENTIALS = {entire JSON output from step 1}
AZURE_CLIENT_ID = {clientId from JSON}
AZURE_CLIENT_SECRET = {clientSecret from JSON}
AZURE_SUBSCRIPTION_ID = {subscriptionId from JSON}
AZURE_TENANT_ID = {tenantId from JSON}
AZURE_STATIC_WEB_APPS_API_TOKEN = {will be generated after Static Web App creation}
```

**Note**: The Terraform configuration now uses proper Service Principal authentication instead of Azure CLI authentication for CI/CD compatibility. Both the provider and backend (remote state) use ARM environment variables for authentication.

### 3. Initialize Terraform State (Optional)

For production, consider using remote state:

```bash
# Create storage account for Terraform state
az group create --name rg-terraform-state --location eastus
az storage account create --name stterraformstatevc --resource-group rg-terraform-state

# Update terraform/main.tf with backend configuration
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformstatevc"
    container_name       = "tfstate"
    key                  = "vehicle-rental.tfstate"
  }
}
```

### 4. Test the Pipeline

1. **Push to main branch** to trigger the pipeline
2. **Monitor the workflow** in GitHub Actions tab
3. **Check Azure resources** are created successfully

## Pipeline Stages

### 🔨 Build & Test
- Restores .NET dependencies
- Builds solution
- Runs 42 unit tests
- Builds React frontend
- Uploads artifacts

### 🏗️ Infrastructure
- Authenticates to Azure
- Runs `terraform plan`
- Applies infrastructure changes
- Creates: Resource Group, Container Registry, App Service, Static Web App

### 🚀 Deploy
- Downloads build artifacts
- Builds and pushes Docker image
- Deploys API to Azure App Service
- Deploys frontend to Static Web App

## Resources Created

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `rg-vehicle-rental-dev` | Container for all resources |
| Container Registry | `crvehiclerentaldev` | Docker image storage |
| App Service Plan | `plan-vehicle-rental-dev` | Hosting plan (B1 SKU) |
| App Service | `app-vehicle-rental-api-dev` | .NET API hosting |
| Static Web App | `swa-vehicle-rental-dev` | React frontend hosting |
| Application Insights | `appi-vehicle-rental-dev` | Monitoring & analytics |

## Accessing Your Application

After successful deployment:

- **API**: `https://app-vehicle-rental-api-dev.azurewebsites.net`
- **Frontend**: `https://{random}.1.azurestaticapps.net`
- **Swagger**: `https://app-vehicle-rental-api-dev.azurewebsites.net/swagger`

## Troubleshooting

### Common Issues

1. **"Resource already exists"** - Check if resources exist in Azure portal
2. **"Insufficient permissions"** - Verify service principal has Contributor role
3. **"Docker build failed"** - Check Dockerfile and .dockerignore configuration
4. **"Tests failed"** - Review test output in GitHub Actions logs
5. **"Additional quota required"** - Azure subscription quota limits reached
   - **Solution**: Configuration updated to use F1 (Free) tier instead of B1
   - **Alternative**: Request quota increase in Azure portal under Support → New Support Request

### Manual Cleanup

To remove all resources:

```bash
az group delete --name rg-vehicle-rental-dev --yes --no-wait
```

## Cost Estimation

Monthly cost (~$5 USD):
- App Service F1 (Free): $0
- Container Registry Basic: ~$5
- Static Web App Free: $0
- Application Insights: ~$2-5 (based on usage)

**Note**: F1 tier has limitations (60 CPU minutes/day, 1GB storage) but is perfect for learning and development.

## Next Steps

1. **Set up monitoring** - Configure alerts in Application Insights
2. **Add secrets management** - Use Azure Key Vault for sensitive data
3. **Implement feature flags** - Add environment-based toggles
4. **Scale infrastructure** - Upgrade to Standard SKUs for production

## Local Development

Test Docker build locally:

```bash
# Build image
docker build -t fleet-api .

# Run container
docker run -p 8080:80 fleet-api

# Test API
curl http://localhost:8080/health
```