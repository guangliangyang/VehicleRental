#!/bin/bash

# Vehicle Rental System - Frontend Configuration Update Script
# This script updates the React frontend configuration with the actual API Management URL

set -e

# Configuration
RESOURCE_GROUP="vehicle-rental-rg"
APIM_NAME="vehicle-rental-apim"
FRONTEND_ENV_FILE="src/web/vehicle-rental-web/.env.production"

echo "🔧 Updating frontend configuration with API Management URL..."

# Get APIM gateway URL
echo "📋 Getting API Management details..."
APIM_GATEWAY_URL=$(az apim show --name $APIM_NAME --resource-group $RESOURCE_GROUP --query "gatewayUrl" --output tsv 2>/dev/null)

if [ -z "$APIM_GATEWAY_URL" ]; then
    echo "❌ Could not get APIM gateway URL. Please ensure:"
    echo "   1. You're logged into Azure CLI"
    echo "   2. The API Management instance '$APIM_NAME' exists"
    echo "   3. You have access to resource group '$RESOURCE_GROUP'"
    exit 1
fi

# Remove trailing slash if present
APIM_GATEWAY_URL=${APIM_GATEWAY_URL%/}
FULL_API_URL="${APIM_GATEWAY_URL}/fleet"

echo "   APIM Gateway URL: $APIM_GATEWAY_URL"
echo "   Full API URL: $FULL_API_URL"

# Update the production environment file
echo "📝 Updating $FRONTEND_ENV_FILE..."

# Create backup
cp "$FRONTEND_ENV_FILE" "$FRONTEND_ENV_FILE.backup"

# Update the API URL
cat > "$FRONTEND_ENV_FILE" << EOF
# Production environment configuration for API Management
# API Management Gateway URL (no subscription key required)
REACT_APP_API_URL=$FULL_API_URL

# Note: REACT_APP_API_KEY is not set because API is configured with subscription-required=false
# This simplifies frontend integration and eliminates the need for subscription key management
EOF

echo "✅ Frontend configuration updated successfully!"
echo ""
echo "📋 Updated Configuration:"
echo "   Environment file: $FRONTEND_ENV_FILE"
echo "   API URL: $FULL_API_URL"
echo ""
echo "🚀 Next steps:"
echo "   1. Build the React application: cd src/web/vehicle-rental-web && npm run build"
echo "   2. Deploy to Azure Static Web Apps or your preferred hosting platform"
echo "   3. Ensure CORS is configured in API Management for your frontend domain"
echo ""
echo "💡 For local development, use: npm start (uses .env.development with localhost:5001)"