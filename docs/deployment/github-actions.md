# GitHub Actions CI/CD Pipeline

This guide explains the automated CI/CD pipeline for the Vehicle Rental System using GitHub Actions.

## Pipeline Overview

The pipeline automatically:
1. **Builds** the .NET API and React frontend
2. **Tests** all components with comprehensive test suites
3. **Deploys** infrastructure using Terraform
4. **Deploys** applications to Azure Container Apps

## Pipeline Stages

### 🔨 Build & Test
```yaml
- name: Build & Test
  runs-on: ubuntu-latest
  steps:
    - Build .NET solution
    - Run unit tests (42 tests)
    - Run integration tests
    - Build React frontend
    - Publish artifacts
```

### 🏗️ Infrastructure Deployment
```yaml
- name: Infrastructure
  runs-on: ubuntu-latest
  steps:
    - Setup Terraform
    - Initialize backend storage
    - Plan infrastructure changes
    - Apply Terraform configuration
```

### 🚀 Application Deployment
```yaml
- name: Deploy Applications
  runs-on: ubuntu-latest
  steps:
    - Build Docker images
    - Push to Azure Container Registry
    - Deploy to Container Apps
    - Deploy frontend to Static Web Apps
```

## Setup Instructions

### 1. Fork Repository

Fork the repository to your GitHub account to enable Actions.

### 2. Create Azure Service Principal

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac --name "sp-vehicle-rental-cicd" \
  --role="Contributor" \
  --scopes="/subscriptions/{subscription-id}" \
  --sdk-auth
```

Save the JSON output for the next step.

### 3. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AZURE_CREDENTIALS` | Full JSON from service principal | `{"clientId": "...", ...}` |
| `AZURE_CLIENT_ID` | Client ID from JSON | `12345678-1234-1234-1234-123456789012` |
| `AZURE_CLIENT_SECRET` | Client secret from JSON | `your-secret-value` |
| `AZURE_SUBSCRIPTION_ID` | Subscription ID from JSON | `12345678-1234-1234-1234-123456789012` |
| `AZURE_TENANT_ID` | Tenant ID from JSON | `12345678-1234-1234-1234-123456789012` |

### 4. Trigger Pipeline

```bash
# Push to main branch to trigger deployment
git push origin main
```

## Pipeline Configuration

### Workflow File Location
```
.github/workflows/main.yml
```

### Key Features

**🔄 Automatic Triggers**
- Push to `main` branch
- Pull request validation
- Manual workflow dispatch

**📦 Artifact Management**
- Build artifacts cached between stages
- Docker images versioned with commit SHA
- Test results and coverage reports

**🛡️ Security**
- Service Principal authentication
- Key Vault integration for secrets
- No hardcoded credentials

**⚡ Performance**
- Parallel job execution
- Dependency caching
- Incremental builds

## Infrastructure Management

### Terraform Backend

The pipeline automatically manages Terraform state:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformvehicle"
    container_name       = "tfstate"
    key                  = "vehicle-rental.tfstate"
  }
}
```

**Benefits:**
- **State Persistence**: Survives pipeline runs
- **Concurrent Protection**: Prevents conflicts
- **Team Collaboration**: Shared state across developers

### Idempotent Deployments

All deployments are idempotent:
- ✅ Safe to run multiple times
- ✅ Only applies necessary changes
- ✅ Handles resource dependencies
- ✅ Maintains desired state

## Monitoring & Debugging

### Pipeline Status

Monitor pipeline status in GitHub:
- **Actions tab** shows all workflow runs
- **Real-time logs** for debugging
- **Status badges** for README

### Common Issues

**Build Failures**
```bash
# Check build logs in Actions tab
# Common causes:
- NuGet package conflicts
- Test failures
- Missing dependencies
```

**Infrastructure Failures**
```bash
# Check Terraform logs
# Common causes:
- Resource naming conflicts
- Insufficient permissions
- Azure quota limits
```

**Deployment Failures**
```bash
# Check Container Apps logs
# Common causes:
- Image pull errors
- Configuration issues
- Network connectivity
```

### Debug Commands

```bash
# View pipeline logs locally
gh run list
gh run view <run-id>

# Check Azure resources
az resource list --resource-group rg-vehicle-rental-dev

# Monitor Container App
az containerapp logs show --name ca-vehicle-rental-api-dev --resource-group rg-vehicle-rental-dev
```

## Environment Strategy

### Development Environment
- **Trigger**: Push to `main` branch
- **Resources**: `rg-vehicle-rental-dev`
- **Domain**: Auto-generated Azure domains

### Production Environment (Future)
- **Trigger**: Git tags (v1.0.0)
- **Resources**: `rg-vehicle-rental-prod`
- **Domain**: Custom domains with SSL

### Branch Protection

Configure branch protection rules:
```yaml
main:
  required_status_checks:
    - build-and-test
    - infrastructure-validation
  enforce_admins: true
  required_reviews: 1
```

## Cost Management

### Pipeline Costs
- **GitHub Actions**: 2,000 minutes/month free
- **Azure resources**: Pay-per-use Container Apps
- **Storage**: Minimal cost for artifacts and state

### Cost Optimization
```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}

# Cleanup resources
- name: Cleanup
  if: failure()
  run: terraform destroy -auto-approve
```

## Advanced Features

### Matrix Builds
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    dotnet: [8.0.x]
```

### Conditional Deployments
```yaml
- name: Deploy to Production
  if: startsWith(github.ref, 'refs/tags/v')
  run: terraform apply -auto-approve
```

### Notifications
```yaml
- name: Notify Teams
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Security Best Practices

### Secret Management
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate service principal credentials regularly
- ✅ Limit service principal permissions
- ✅ Enable Azure Key Vault for application secrets

### Network Security
- ✅ Use private endpoints for database access
- ✅ Enable VNet integration for Container Apps
- ✅ Configure firewall rules appropriately
- ✅ Implement proper CORS policies

### Code Security
- ✅ Dependency scanning with GitHub Security
- ✅ CodeQL analysis for vulnerabilities
- ✅ Container image scanning
- ✅ Infrastructure security with tfsec

## Pipeline Optimization

### Performance Tips
1. **Cache Dependencies**: NuGet packages, npm modules
2. **Parallel Jobs**: Build and test simultaneously
3. **Incremental Builds**: Only rebuild changed components
4. **Artifact Compression**: Reduce transfer times

### Reliability Tips
1. **Retry Logic**: Handle transient failures
2. **Health Checks**: Verify deployments succeed
3. **Rollback Strategy**: Quick recovery from failures
4. **Monitoring**: Alerts for pipeline failures

## Next Steps

1. **Add environments**: Staging and production
2. **Implement feature flags**: Gradual rollouts
3. **Add performance tests**: Load testing automation
4. **Security scanning**: Automated vulnerability checks
5. **Multi-region deployment**: High availability setup