# Infrastructure

This directory contains all infrastructure-as-code configurations for the Vehicle Rental System.

## Structure

- `container-apps/` - **Primary deployment strategy** using Azure Container Apps with Terraform
- `archive/k8s/` - Legacy Kubernetes configurations (archived)

## Primary Deployment: Azure Container Apps

The Container Apps deployment is the recommended and actively maintained infrastructure approach. It provides:

- Serverless container orchestration
- Built-in HTTPS with automatic SSL certificates
- Native integration with Azure services (Key Vault, Cosmos DB, etc.)
- Simplified configuration and management

### Getting Started

```bash
cd container-apps
terraform init
terraform plan
terraform apply
```

## Archived Infrastructure

The `archive/` directory contains deprecated infrastructure configurations that are no longer actively used but preserved for reference.