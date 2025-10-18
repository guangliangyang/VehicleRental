#!/bin/bash

# Vehicle Rental System - Docker Build and Push Script
# This script builds and pushes the FleetService API to Azure Container Registry

set -e

# Configuration
ACR_NAME="vehiclerentalacr"
IMAGE_NAME="fleetservice-api"
TAG="latest"
BUILD_TAG="$(date +%Y%m%d-%H%M%S)"

echo "🐳 Building and pushing Docker image..."

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query "loginServer" --output tsv)
echo "📝 ACR Login Server: $ACR_LOGIN_SERVER"

# Login to ACR
echo "🔑 Logging into ACR..."
az acr login --name $ACR_NAME

# Build Docker image
echo "🔨 Building Docker image..."
docker build -f src/services/FleetService/FleetService.Api/Dockerfile \
    -t $ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG \
    -t $ACR_LOGIN_SERVER/$IMAGE_NAME:$BUILD_TAG \
    .

# Push Docker image
echo "⬆️  Pushing Docker image to ACR..."
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:$BUILD_TAG

echo "✅ Docker image pushed successfully!"
echo ""
echo "📋 Image Details:"
echo "   Registry: $ACR_LOGIN_SERVER"
echo "   Image: $IMAGE_NAME"
echo "   Tags: $TAG, $BUILD_TAG"
echo "   Full Image URL: $ACR_LOGIN_SERVER/$IMAGE_NAME:$TAG"
ech
echo "🏃‍♂️ Next step: Update k8s/03-deployment.yaml with the image URL above"