# Configuration Management

This directory contains centralized configuration files for all environments and components.

## Structure

- `development/` - Local development environment configurations
- `staging/` - Staging environment configurations
- `production/` - Production environment configurations

## Environment Files

### API Configuration Templates (`api.env.template`)
- Cosmos DB connection settings templates
- Application-specific settings templates

### Frontend Configuration Templates (`frontend.env.template`)
- API endpoints templates
- Environment-specific feature flags templates
- External service URLs templates

## Usage

### Development Setup
```bash
# Copy templates and fill in your actual values
cp config/development/api.env.template config/development/api.env
cp config/production/frontend.env.template config/production/frontend.env

# Edit the files with your actual secrets
# Then copy to application locations
cp config/development/api.env src/services/FleetService/FleetService.Api/.env
cp config/production/frontend.env src/web/vehicle-rental-web/.env.production
```

### Environment Variables

All configuration follows this naming convention:
- `COSMOS_*` - Cosmos DB related settings
- `REACT_APP_*` - React frontend settings
- `ASPNETCORE_*` - ASP.NET Core settings

## Security Notes

- Never commit secrets or keys to version control
- Use Azure Key Vault for production secrets
- Local development uses environment variables only
- Production uses Azure Key Vault with DefaultAzureCredential