#!/bin/bash

# Vehicle Rental System - API Management Configuration Script
# This script configures Azure API Management with FleetService API

set -e

# Configuration
RESOURCE_GROUP="vehicle-rental-rg"
APIM_NAME="vehicle-rental-apim"
API_NAME="fleetservice-api"
API_PATH="fleet"
BACKEND_URL=""  # Will be set from AKS LoadBalancer service

echo "🌐 Configuring API Management..."

# Get APIM instance details and wait for activation
echo "📋 Getting APIM details..."
echo "⏳ Checking APIM activation status..."

# Check APIM provisioning state
APIM_STATE=$(az apim show --name $APIM_NAME --resource-group $RESOURCE_GROUP --query "provisioningState" --output tsv 2>/dev/null || echo "NotFound")

if [ "$APIM_STATE" != "Succeeded" ]; then
    echo "⚠️  APIM is in state: $APIM_STATE"
    if [ "$APIM_STATE" = "InProgress" ] || [ "$APIM_STATE" = "Creating" ]; then
        echo "   APIM is still being created/activated. This can take 15-30 minutes."
        echo "   Please wait and retry later with: ./scripts/04-configure-api-management.sh"
        exit 1
    elif [ "$APIM_STATE" = "NotFound" ]; then
        echo "   APIM instance not found. Please run: ./scripts/01-deploy-azure-resources.sh"
        exit 1
    else
        echo "   APIM is in unexpected state. Please check Azure portal."
        exit 1
    fi
fi

APIM_URL=$(az apim show --name $APIM_NAME --resource-group $RESOURCE_GROUP --query "gatewayUrl" --output tsv)
echo "✅ APIM is ready!"
echo "   APIM Gateway URL: $APIM_URL"

# Get AKS LoadBalancer service details
echo "🔍 Getting AKS LoadBalancer service details..."
kubectl config current-context | grep -q "vehicle-rental-aks" || {
    echo "Please ensure you're connected to the correct AKS cluster"
    exit 1
}

# Get LoadBalancer external IP
EXTERNAL_IP=$(kubectl get svc fleetservice-api-loadbalancer --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null)
if [ -z "$EXTERNAL_IP" ]; then
    echo "❌ LoadBalancer external IP not found. Please ensure:"
    echo "   1. The fleetservice-api-loadbalancer service is deployed"
    echo "   2. Azure has assigned an external IP (may take 2-3 minutes)"
    echo "   3. Check with: kubectl get svc fleetservice-api-loadbalancer"
    exit 1
fi

BACKEND_URL="http://$EXTERNAL_IP"
echo "   LoadBalancer IP: $EXTERNAL_IP"
echo "   Backend URL: $BACKEND_URL"

# Create API in APIM (no subscription required for simplified access)
echo "🔧 Creating API in APIM..."
az apim api create \
    --resource-group $RESOURCE_GROUP \
    --service-name $APIM_NAME \
    --api-name $API_NAME \
    --path $API_PATH \
    --display-name "Fleet Service API" \
    --description "Vehicle fleet management API" \
    --service-url $BACKEND_URL \
    --protocols https http \
    --subscription-required false

# Note: Backend configuration is handled automatically by API creation
# Azure APIM will route to the service-url specified in the API creation above
echo "✅ Backend configuration handled by API service-url: $BACKEND_URL"

# Add operations
echo "📡 Adding API operations..."

# Get nearby vehicles operation
az apim api operation create \
    --resource-group $RESOURCE_GROUP \
    --service-name $APIM_NAME \
    --api-name $API_NAME \
    --operation-id get-nearby-vehicles \
    --method GET \
    --url-template "/vehicles/nearby" \
    --display-name "Get Nearby Vehicles" \
    --description "Get vehicles within specified radius"

# Health check operation
az apim api operation create \
    --resource-group $RESOURCE_GROUP \
    --service-name $APIM_NAME \
    --api-name $API_NAME \
    --operation-id health-check \
    --method GET \
    --url-template "/health" \
    --display-name "Health Check" \
    --description "API health check endpoint"

# Note: CORS policy configuration
echo "⚠️  CORS Policy Configuration Required:"
echo "   Since Azure CLI doesn't support policy configuration directly,"
echo "   please configure CORS manually in the Azure portal:"
echo "   1. Go to Azure Portal > API Management > APIs > $API_NAME"
echo "   2. Select 'All operations' > Policies > Add inbound policy > CORS"
echo "   3. Add allowed origins:"
echo "      - http://localhost:3000 (开发环境)"
echo "      - https://adlsgen2vc.z13.web.core.windows.net (生产环境)"
echo "      - https://*.azurewebsites.net (Azure部署)"
echo "   4. Allow all methods and headers"
echo ""
echo "   Alternatively, use Azure REST API or ARM templates for automation"

# Simplified access - no subscription required
echo "✅ API configured with no subscription requirement for simplified access"
SUBSCRIPTION_KEY="Not required - API accessible without subscription key"

# Configuration complete - no temporary files to clean up

echo "✅ API Management configured successfully!"
echo ""
echo "📋 API Management Summary:"
echo "   Gateway URL: $APIM_URL"
echo "   API Path: $APIM_URL/$API_PATH"
echo "   Nearby Vehicles: $APIM_URL/$API_PATH/vehicles/nearby"
echo "   Health Check: $APIM_URL/$API_PATH/health"
echo "   Subscription Key: $SUBSCRIPTION_KEY"
echo ""
echo "✅ LoadBalancer Network Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   🟢 Using LoadBalancer with public IP - APIM can reach backend"
echo "   💰 Cost: +$20/month for Azure LoadBalancer"
echo ""
echo "🏃‍♂️ Next step: Update frontend configuration to use APIM URL"