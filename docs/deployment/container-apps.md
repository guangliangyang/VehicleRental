# Azure Container Apps Deployment

This guide walks you through deploying the Vehicle Rental System to Azure Container Apps using Terraform.

## Prerequisites

- **Azure CLI** installed and logged in
- **Terraform** 1.6+ installed locally
- **Docker** installed for local testing
- Valid Azure subscription

## Architecture

```
React Frontend (Static Web App) → Azure Container Apps → Fleet API → Cosmos DB
                                                      ↓
                                                Key Vault (Secrets)
```

## Deployment Steps

### 1. Setup Azure Authentication

```bash
# Login to Azure
az login

# Create service principal for Terraform
az ad sp create-for-rbac --name "sp-vehicle-rental" \
  --role="Contributor" \
  --scopes="/subscriptions/{subscription-id}"
```

### 2. Configure Environment Variables

```bash
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_TENANT_ID="your-tenant-id"
```

### 3. Deploy Infrastructure

```bash
cd infra/container-apps

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

This creates:
- **Resource Group**: `rg-vehicle-rental-dev`
- **Container Registry**: For Docker images
- **Container Apps Environment**: Serverless container platform
- **Container App**: Fleet API service
- **Key Vault**: Secure secret storage
- **Static Web App**: React frontend hosting
- **Application Insights**: Monitoring and analytics

### 4. Configure Secrets

```bash
# Set secrets in Key Vault (replace with your values)
az keyvault secret set --vault-name "kv-vehicle-rental-dev" \
  --name "cosmos-endpoint" \
  --value "https://your-cosmos-db.documents.azure.com:443/"

az keyvault secret set --vault-name "kv-vehicle-rental-dev" \
  --name "cosmos-key" \
  --value "your-cosmos-key"

az keyvault secret set --vault-name "kv-vehicle-rental-dev" \
  --name "cosmos-database-id" \
  --value "your-database-id"

az keyvault secret set --vault-name "kv-vehicle-rental-dev" \
  --name "cosmos-container-id" \
  --value "your-container-id"
```

### 5. Deploy Application Code

```bash
# Build and push Docker image
docker build -t fleet-api .
docker tag fleet-api crvehiclerentaldev.azurecr.io/fleet-api:latest
docker push crvehiclerentaldev.azurecr.io/fleet-api:latest

# Update Container App
az containerapp update \
  --name ca-vehicle-rental-api-dev \
  --resource-group rg-vehicle-rental-dev \
  --image crvehiclerentaldev.azurecr.io/fleet-api:latest
```

### 6. Deploy Frontend

```bash
cd src/web/vehicle-rental-web

# Build for production
npm run build

# Deploy to Static Web App (via GitHub Actions or manual)
# See: https://docs.microsoft.com/en-us/azure/static-web-apps/
```

## Configuration

### Container Apps Environment Variables

The application automatically retrieves secrets from Key Vault using:
- **Managed Identity**: System-assigned identity for secure access
- **DefaultAzureCredential**: Automatic authentication handling
- **Key Vault Integration**: Direct secret retrieval at runtime

### Required Azure Services

Before deployment, ensure these services are available:
- **Azure Cosmos DB** (SQL API with geo-spatial indexing)
- **Azure SignalR Service** (optional, for real-time features)

## Verification

### Check Container App Status
```bash
az containerapp list \
  --resource-group rg-vehicle-rental-dev \
  --output table
```

### Test API Endpoints
```bash
# Health check
curl "https://ca-vehicle-rental-api-dev.nicemushroom-bc9c7f96.eastus.azurecontainerapps.io/health"

# API endpoints
curl "https://ca-vehicle-rental-api-dev.nicemushroom-bc9c7f96.eastus.azurecontainerapps.io/vehicles/nearby?latitude=40.7128&longitude=-74.0060&radius=5"
```

### Monitor Application
```bash
# View logs
az containerapp logs show \
  --name ca-vehicle-rental-api-dev \
  --resource-group rg-vehicle-rental-dev

# Monitor metrics in Azure portal
open https://portal.azure.com
```

## Benefits of Container Apps

### Serverless Benefits
- **Auto-scaling**: Scale to zero when not in use
- **Pay-per-use**: Only pay for actual consumption
- **Managed infrastructure**: No server management required
- **Built-in HTTPS**: Automatic SSL certificates

### Enterprise Features
- **Managed Identity**: Secure access to Azure services
- **VNet Integration**: Private networking support
- **Blue-green deployments**: Zero-downtime updates
- **Monitoring**: Integrated with Application Insights

## Troubleshooting

### Common Issues

1. **Container App Not Starting**
   ```bash
   # Check logs
   az containerapp logs show --name ca-vehicle-rental-api-dev --resource-group rg-vehicle-rental-dev

   # Check environment variables
   az containerapp show --name ca-vehicle-rental-api-dev --resource-group rg-vehicle-rental-dev
   ```

2. **Key Vault Access Denied**
   ```bash
   # Verify managed identity permissions
   az role assignment list --assignee $(az containerapp show --name ca-vehicle-rental-api-dev --resource-group rg-vehicle-rental-dev --query identity.principalId -o tsv)
   ```

3. **Docker Image Pull Errors**
   ```bash
   # Verify ACR credentials
   az acr credential show --name crvehiclerentaldev
   ```

### Performance Tuning

- **CPU/Memory**: Adjust container resources based on load
- **Replicas**: Configure min/max replicas for auto-scaling
- **Health Probes**: Implement readiness and liveness checks

## Production Considerations

### Security
- Enable **VNet integration** for private networking
- Use **Private Endpoints** for Cosmos DB access
- Implement **Azure AD authentication** for API access
- Enable **Web Application Firewall** if needed

### Monitoring
- Configure **Application Insights** alerts
- Set up **Log Analytics** dashboards
- Monitor **container metrics** and performance

### Backup & Disaster Recovery
- Regular **Cosmos DB backups** (automated)
- **Infrastructure as Code** ensures reproducible deployments
- **Multi-region** deployment for high availability

## Cleanup

To remove all resources:

```bash
terraform destroy
```

Or manually:
```bash
az group delete --name rg-vehicle-rental-dev --yes --no-wait
```

## Cost Optimization

Container Apps pricing is based on:
- **vCPU**: $0.000024/vCPU-second
- **Memory**: $0.000002/GiB-second
- **HTTP Requests**: $0.40/million requests

Estimated monthly cost for development: **$5-15 USD**

## Next Steps

1. **Set up CI/CD pipeline** with GitHub Actions
2. **Configure monitoring** and alerting
3. **Implement authentication** with Azure AD
4. **Add custom domains** and SSL certificates
5. **Scale to production** with multiple environments