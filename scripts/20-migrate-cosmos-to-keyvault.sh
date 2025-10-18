#!/bin/bash

# ==========================================
# Migrate Cosmos DB secrets from .env file to Azure Key Vault
# with auto-recover or recreate deleted secrets
# ==========================================

set -e

KEY_VAULT_NAME="kv-vehicle-rental-dev"
ENV_FILE="src/services/FleetService/FleetService.Api/.env"

# 🎨 Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔑 Migrating Cosmos DB secrets from .env to Azure Key Vault${NC}"
echo "============================================================="

# 🧱 Check .env
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: .env file not found at $ENV_FILE${NC}"
  exit 1
fi

# 🧱 Check Azure CLI
if ! command -v az &>/dev/null; then
  echo -e "${RED}❌ Error: Azure CLI not installed${NC}"
  exit 1
fi

if ! az account show &>/dev/null; then
  echo -e "${YELLOW}⚠️  You are not logged in to Azure. Please run: az login${NC}"
  exit 1
fi

# 🔍 Parse .env values
get_env_value() {
  local key=$1
  grep "^${key}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r'
}

COSMOS_ENDPOINT=$(get_env_value "COSMOS_ENDPOINT")
COSMOS_KEY=$(get_env_value "COSMOS_KEY")
COSMOS_DATABASE_ID=$(get_env_value "COSMOS_DATABASE_ID")
COSMOS_CONTAINER_ID=$(get_env_value "COSMOS_CONTAINER_ID")

if [ -z "$COSMOS_ENDPOINT" ] || [ -z "$COSMOS_KEY" ] || [ -z "$COSMOS_DATABASE_ID" ] || [ -z "$COSMOS_CONTAINER_ID" ]; then
  echo -e "${RED}❌ Missing required variables in .env${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Loaded all Cosmos DB values${NC}"
echo "   COSMOS_ENDPOINT: $COSMOS_ENDPOINT"
echo "   COSMOS_DATABASE_ID: $COSMOS_DATABASE_ID"
echo "   COSMOS_CONTAINER_ID: $COSMOS_CONTAINER_ID"
echo "   COSMOS_KEY: [REDACTED]"
echo ""

# 🔍 Check Key Vault existence
if ! az keyvault show --name "$KEY_VAULT_NAME" &>/dev/null; then
  echo -e "${RED}❌ Key Vault '$KEY_VAULT_NAME' not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Key Vault '$KEY_VAULT_NAME' is available${NC}"

# ------------------------------------------
# Function: fix or create secret
# ------------------------------------------
fix_and_set_secret() {
  local secret_name=$1
  local secret_value=$2
  local description=$3

  echo -e "${BLUE}🔍 Checking secret '$secret_name'...${NC}"

  local deleted_secret
  deleted_secret=$(az keyvault secret list-deleted --vault-name "$KEY_VAULT_NAME" --query "[?name=='$secret_name'].name" -o tsv)

  if [ "$deleted_secret" == "$secret_name" ]; then
    echo -e "${YELLOW}⚠️  Secret '$secret_name' is soft-deleted. Recovering...${NC}"
    if az keyvault secret recover --vault-name "$KEY_VAULT_NAME" --name "$secret_name" &>/dev/null; then
      echo -e "${GREEN}✅ Recovered secret '$secret_name'${NC}"
      sleep 2
    else
      echo -e "${RED}❌ Failed to recover. Purging...${NC}"
      az keyvault secret purge --vault-name "$KEY_VAULT_NAME" --name "$secret_name"
      sleep 2
    fi
  fi

  echo -e "${BLUE}📝 Setting secret '$secret_name'...${NC}"
  if az keyvault secret set \
      --vault-name "$KEY_VAULT_NAME" \
      --name "$secret_name" \
      --value "$secret_value" \
      --description "$description" &>/dev/null; then
    echo -e "${GREEN}✅ Updated secret '$secret_name'${NC}"
  else
    echo -e "${RED}❌ Failed to set secret '$secret_name'${NC}"
    exit 1
  fi
}

# ------------------------------------------
# Upload all Cosmos secrets
# ------------------------------------------
echo ""
echo -e "${BLUE}🚀 Uploading all Cosmos secrets to Key Vault${NC}"
echo "============================================"

fix_and_set_secret "cosmos-endpoint" "$COSMOS_ENDPOINT" "Cosmos DB endpoint URL"
fix_and_set_secret "cosmos-key" "$COSMOS_KEY" "Cosmos DB primary key"
fix_and_set_secret "cosmos-database-id" "$COSMOS_DATABASE_ID" "Cosmos DB database id"
fix_and_set_secret "cosmos-container-id" "$COSMOS_CONTAINER_ID" "Cosmos DB container id"

echo ""
echo -e "${GREEN}🎉 All secrets processed successfully!${NC}"
echo "============================================"
echo -e "${YELLOW}🔍 Verify with:${NC}"
echo "az keyvault secret list --vault-name $KEY_VAULT_NAME -o table"
echo "az keyvault secret show --vault-name $KEY_VAULT_NAME --name cosmos-endpoint --query value -o tsv"
