#!/bin/bash

# Vehicle Rental System - Kubernetes Deployment Script
# This script deploys the FleetService API to AKS cluster

set -e

# Configuration
RESOURCE_GROUP="vehicle-rental-rg"
AKS_CLUSTER="vehicle-rental-aks"
ACR_NAME="vehiclerentalacr"
NAMESPACE="default"

echo "☸️  Deploying to AKS cluster..."

# Get AKS credentials
echo "🔑 Getting AKS credentials..."
az aks get-credentials \
    --resource-group $RESOURCE_GROUP \
    --name $AKS_CLUSTER \
    --overwrite-existing

# Create ACR secret for image pulling
echo "🔐 Creating ACR secret..."
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query "loginServer" --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

kubectl create secret docker-registry acr-secret \
    --docker-server=$ACR_LOGIN_SERVER \
    --docker-username=$ACR_USERNAME \
    --docker-password=$ACR_PASSWORD \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
echo "📦 Applying Kubernetes manifests..."

echo "  🔐 Applying secrets with real values..."
# Use our new secret management script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/apply-secrets.sh"

echo "  📋 Applying configmap..."
kubectl apply -f k8s/02-configmap.yaml

echo "  🚀 Applying deployment..."
kubectl apply -f k8s/03-deployment.yaml

echo "  🌐 Applying service..."
kubectl apply -f k8s/04-service.yaml

echo "  📈 Applying HPA..."
kubectl apply -f k8s/05-hpa.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/fleetservice-api --namespace=$NAMESPACE --timeout=300s

# Get service information
echo "📋 Getting service information..."
kubectl get services -l app=fleetservice-api --namespace=$NAMESPACE

# Get LoadBalancer external IP for API Management access
echo "🌐 Getting LoadBalancer external IP..."
echo "⏳ Waiting for external IP assignment (this may take 2-3 minutes)..."
EXTERNAL_IP=""
TIMEOUT=300  # 5 minutes timeout
ELAPSED=0
while [ -z "$EXTERNAL_IP" ] && [ $ELAPSED -lt $TIMEOUT ]; do
    echo "   Checking for external IP... ($ELAPSED/$TIMEOUT seconds)"
    EXTERNAL_IP=$(kubectl get svc fleetservice-api-loadbalancer --namespace=$NAMESPACE --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}" 2>/dev/null)
    if [ -z "$EXTERNAL_IP" ]; then
        sleep 10
        ELAPSED=$((ELAPSED + 10))
    fi
done

if [ -z "$EXTERNAL_IP" ]; then
    echo "⚠️  LoadBalancer external IP not assigned within timeout"
    echo "   You can check later with: kubectl get svc fleetservice-api-loadbalancer"
    EXTERNAL_IP="<pending>"
else
    echo "✅ LoadBalancer external IP assigned: $EXTERNAL_IP"
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Namespace: $NAMESPACE"
echo "   LoadBalancer IP: $EXTERNAL_IP"
if [ "$EXTERNAL_IP" != "<pending>" ]; then
    echo "   Health Check: http://$EXTERNAL_IP/health"
    echo "   API Endpoint: http://$EXTERNAL_IP/vehicles/nearby"
    echo "   Swagger UI: http://$EXTERNAL_IP/swagger"
else
    echo "   Health Check: http://<external-ip>/health (IP pending)"
    echo "   API Endpoint: http://<external-ip>/vehicles/nearby (IP pending)"
fi
echo ""
echo "🏃‍♂️ Next step: Configure API Management to use this backend"