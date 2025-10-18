#!/bin/bash

# Vehicle Rental System - Apply Secrets Script
# This script loads secrets from secrets.env and applies them to Kubernetes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_FILE="$PROJECT_ROOT/secrets.env"
K8S_SECRET_TEMPLATE="$PROJECT_ROOT/k8s/01-secret.yaml"
K8S_SECRET_APPLIED="/tmp/01-secret-applied.yaml"

echo "🔐 Vehicle Rental System - Applying Secrets to Kubernetes"
echo "=================================================="

# Check if secrets.env exists
if [ ! -f "$SECRETS_FILE" ]; then
    echo "❌ Error: secrets.env file not found at $SECRETS_FILE"
    echo "Please create this file with your real secret values."
    echo "You can copy from secrets.env.template if available."
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed or not in PATH"
    echo "Please install kubectl and ensure it's configured for your cluster"
    exit 1
fi

# Check if connected to Kubernetes cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Error: Not connected to Kubernetes cluster"
    echo "Please run: az aks get-credentials --resource-group vehicle-rental-rg --name vehicle-rental-aks"
    exit 1
fi

echo "✅ Loading secrets from: $SECRETS_FILE"

# Source the secrets file
set -a  # Export all variables
source "$SECRETS_FILE"
set +a  # Stop exporting

# Validate required secrets
if [ -z "$COSMOS_ENDPOINT" ] || [ -z "$COSMOS_KEY" ] || [ -z "$SIGNALR_CONNECTION_STRING" ]; then
    echo "❌ Error: Missing required secrets in $SECRETS_FILE"
    echo "Required: COSMOS_ENDPOINT, COSMOS_KEY, SIGNALR_CONNECTION_STRING"
    exit 1
fi

echo "✅ Secrets loaded successfully"
echo "   - COSMOS_ENDPOINT: ${COSMOS_ENDPOINT:0:30}..."
echo "   - COSMOS_KEY: ${COSMOS_KEY:0:10}..."
echo "   - SIGNALR_CONNECTION_STRING: ${SIGNALR_CONNECTION_STRING:0:30}..."

# Replace placeholders in template and create applied version
echo "🔄 Replacing placeholders in Kubernetes secret template..."
envsubst < "$K8S_SECRET_TEMPLATE" > "$K8S_SECRET_APPLIED"

echo "✅ Template processed successfully"

# Apply the secret to Kubernetes
echo "🚀 Applying secret to Kubernetes cluster..."
kubectl apply -f "$K8S_SECRET_APPLIED"

# Clean up temporary file
rm -f "$K8S_SECRET_APPLIED"

echo "✅ Secret applied successfully to Kubernetes!"
echo ""
echo "🔍 You can verify the secret was created with:"
echo "   kubectl get secret fleetservice-secret"
echo "   kubectl describe secret fleetservice-secret"
echo ""
echo "⚠️  Note: The secret values are base64 encoded in Kubernetes"
echo "📁 Template file remains safe for Git: $K8S_SECRET_TEMPLATE"
echo "🔐 Real secrets remain local in: $SECRETS_FILE"