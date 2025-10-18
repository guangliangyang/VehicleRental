# Vehicle Rental System - Azure Deployment Guide

This guide walks you through deploying the Vehicle Rental System to Azure Kubernetes Service (AKS) with API Management.

## Prerequisites

- Azure CLI installed and logged in
- Docker installed
- kubectl installed
- Valid Azure subscription

## Architecture

```
React Frontend → Azure API Management → AKS Cluster → FleetService API → Cosmos DB
```

## Deployment Steps

### 1. Deploy Azure Resources

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy Azure resources (ACR, AKS, API Management)
./scripts/deploy-azure-resources.sh
```

This creates:
- Resource Group: `vehicle-rental-rg`
- Azure Container Registry: `vehiclerentalacr`
- AKS Cluster: `vehicle-rental-aks`
- API Management: `vehicle-rental-apim`

### 2. Build and Push Docker Image

```bash
# Build and push FleetService API to ACR
./scripts/build-and-push.sh
```

### 3. Update Kubernetes Secrets

Edit `k8s/01-secret.yaml` and update with your actual values:

```yaml
stringData:
  COSMOS_ENDPOINT: "your-cosmos-endpoint"
  COSMOS_KEY: "your-cosmos-key"
  SIGNALR_CONNECTION_STRING: "your-signalr-connection-string"
```

### 4. Deploy to AKS

```bash
# Deploy application to AKS cluster
./scripts/deploy-to-aks.sh
```

This will:
- Create ACR secret for image pulling
- Deploy all Kubernetes resources
- Wait for deployment to be ready
- Display external IP address

### 5. Configure API Management

```bash
# Configure API Management with AKS backend
./scripts/configure-api-management.sh
```

This configures:
- API definition in APIM
- Backend pointing to AKS service
- CORS policies
- API operations

### 6. Update Frontend Configuration

After API Management is configured, update the frontend:

1. **Update `.env.production`** with your APIM gateway URL:
   ```
   REACT_APP_API_URL=https://your-apim-name.azure-api.net/fleet
   ```

2. **If using subscription keys**, add:
   ```
   REACT_APP_API_KEY=your-subscription-key
   ```

3. **Build for production**:
   ```bash
   cd src/web/vehicle-rental-web
   npm run build
   ```

## Verification

### Check AKS Deployment
```bash
kubectl get pods
kubectl get services
kubectl logs -l app=fleetservice-api
```

### Test API through APIM
```bash
# Replace with your actual APIM URL
curl "https://vehicle-rental-apim.azure-api.net/fleet/health"
curl "https://vehicle-rental-apim.azure-api.net/fleet/vehicles/nearby?latitude=40.7128&longitude=-74.0060&radius=5"
```

### Test Frontend
1. Serve the built React app
2. Check browser console for API calls
3. Verify vehicles are displayed on map

## Monitoring and Troubleshooting

### AKS Logs
```bash
kubectl logs -f deployment/fleetservice-api
kubectl describe pod <pod-name>
```

### API Management Logs
- Check Azure portal → API Management → APIs → Test
- Review request/response in APIM developer portal

### Common Issues

1. **External IP Pending**
   - Check AKS node pool has enough resources
   - Verify LoadBalancer service configuration

2. **API Management 502 Error**
   - Verify backend URL points to correct AKS service IP
   - Check AKS service is running and healthy

3. **CORS Issues**
   - Verify CORS policy in API Management
   - Check frontend origin is allowed

4. **Authentication Errors**
   - Verify subscription keys (if used)
   - Check API Management access policies

## Production Considerations

### Security
- Enable Azure AD authentication
- Configure network security groups
- Use Azure Key Vault for secrets
- Enable HTTPS/TLS everywhere

### Scaling
- Configure HPA (already included)
- Consider cluster autoscaler
- Monitor resource usage

### Monitoring
- Enable Application Insights
- Set up Azure Monitor
- Configure log aggregation

### Backup
- Regular Cosmos DB backups
- AKS cluster configuration backup
- Source code in version control

## Cleanup

To remove all resources:

```bash
az group delete --name vehicle-rental-rg --yes --no-wait
```

## Next Steps

1. Set up CI/CD pipeline (Azure DevOps/GitHub Actions)
2. Configure monitoring and alerting
3. Implement authentication/authorization
4. Add more API endpoints as needed
5. Deploy frontend to Azure Static Web Apps or Azure App Service