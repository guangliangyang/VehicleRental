#!/bin/bash

# Vehicle Rental System - Azure Resources Deployment Script
# This script creates all necessary Azure resources for AKS deployment

set -e

# Configuration
RESOURCE_GROUP="vehicle-rental-rg"
LOCATION="eastus"
AKS_CLUSTER="vehicle-rental-aks"
ACR_NAME="vehiclerentalacr"
APIM_NAME="vehicle-rental-apim"
SUBSCRIPTION_ID="f9e8a1cc-119c-4044-96ed-4bd16955be51"  # Set your subscription ID

echo "🚀 Starting Azure resources deployment..."

# Login to Azure (if not already logged in)
echo "📋 Checking Azure login status..."
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure:"
    az login
}

# Set subscription (if provided)
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    echo "🔄 Setting subscription to $SUBSCRIPTION_ID"
    az account set --subscription $SUBSCRIPTION_ID
fi

# Create Resource Group
echo "📁 Creating resource group: $RESOURCE_GROUP"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output none 2>/dev/null || echo "   Resource group already exists"

# Create Azure Container Registry
echo "🐳 Creating Azure Container Registry: $ACR_NAME"
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --output none 2>/dev/null || echo "   ACR already exists"

# Create or update AKS Cluster (Cost-optimized: minimum viable VM size, single node, no monitoring)
echo "☸️  Creating/updating cost-optimized AKS cluster: $AKS_CLUSTER"
echo "💰 Cost optimizations: Single node (Standard_B2s - minimum for system pool), no monitoring addon"

# Check if AKS cluster exists
AKS_EXISTS=$(az aks show --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER --query "name" --output tsv 2>/dev/null || echo "")

if [ -z "$AKS_EXISTS" ]; then
    echo "   Creating new AKS cluster..."
    az aks create \
        --resource-group $RESOURCE_GROUP \
        --name $AKS_CLUSTER \
        --node-count 1 \
        --node-vm-size Standard_B2s \
        --generate-ssh-keys \
        --attach-acr $ACR_NAME \
        --enable-managed-identity
else
    echo "   AKS cluster already exists, ensuring ACR integration..."
    az aks update \
        --resource-group $RESOURCE_GROUP \
        --name $AKS_CLUSTER \
        --attach-acr $ACR_NAME \
        --output none 2>/dev/null || echo "   ACR already attached"
fi

# Get AKS credentials
echo "🔑 Getting AKS credentials"
az aks get-credentials \
    --resource-group $RESOURCE_GROUP \
    --name $AKS_CLUSTER \
    --overwrite-existing

# Check for soft-deleted API Management instance and try to restore
echo "🔍 Checking for soft-deleted API Management instances..."
SOFT_DELETED=$(az apim deletedservice list --query "[?serviceName=='$APIM_NAME']" --output tsv 2>/dev/null || echo "")

if [ ! -z "$SOFT_DELETED" ]; then
    echo "⚠️  Found soft-deleted API Management instance: $APIM_NAME"
    echo "🔄 Attempting to restore the soft-deleted instance..."

    # Get location of the soft-deleted service
    LOCATION=$(az apim deletedservice list --query "[?serviceName=='$APIM_NAME'].location" --output tsv)

    if [ ! -z "$LOCATION" ]; then
        az apim deletedservice restore \
            --service-name $APIM_NAME \
            --location $LOCATION \
            --resource-group $RESOURCE_GROUP || {
            echo "❌ Failed to restore. Please run: ./scripts/00-cleanup-apim.sh"
            exit 1
        }
        echo "✅ Successfully restored soft-deleted API Management instance"
    else
        echo "❌ Could not determine location. Please run: ./scripts/00-cleanup-apim.sh"
        exit 1
    fi
fi

# Create API Management instance
echo "🌐 Creating API Management: $APIM_NAME"

# Check if APIM exists
APIM_EXISTS=$(az apim show --resource-group $RESOURCE_GROUP --name $APIM_NAME --query "name" --output tsv 2>/dev/null || echo "")

if [ -z "$APIM_EXISTS" ]; then
    echo "   Creating new API Management instance..."
    az apim create \
        --resource-group $RESOURCE_GROUP \
        --name $APIM_NAME \
        --publisher-email "admin@vehiclerental.com" \
        --publisher-name "Vehicle Rental System" \
        --sku-name Developer
else
    echo "   API Management instance already exists"
fi

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)
echo "📝 ACR Login Server: $ACR_LOGIN_SERVER"

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "passwords[0].value" --output tsv)

echo "✅ Azure resources deployment completed!"
echo ""
echo "📋 Resource Summary:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   AKS Cluster: $AKS_CLUSTER $([ -z "$AKS_EXISTS" ] && echo "(created)" || echo "(existing)")"
echo "   ACR: $ACR_LOGIN_SERVER"
echo "   API Management: $APIM_NAME $([ -z "$APIM_EXISTS" ] && echo "(created)" || echo "(existing)")"
echo ""
echo "🔑 ACR Credentials:"
echo "   Username: $ACR_USERNAME"
echo "   Password: [Hidden - check Azure portal]"
echo ""
echo "ℹ️  Script is idempotent - existing resources are preserved"
echo ""
echo "🏃‍♂️ Next steps:"
echo "   1. Build and push Docker image: ./scripts/02-build-and-push.sh"
echo "   2. Deploy application to AKS: ./scripts/03-deploy-to-aks.sh"
echo "   3. Configure API Management: ./scripts/04-configure-api-management.sh"