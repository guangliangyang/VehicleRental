# Azure Entra ID Application Registration Configuration

## Required Azure AD App Registration Settings

### Application Registration
- **Name**: Vehicle Rental System
- **Supported account types**: Accounts in this organizational directory only (Single tenant)
- **Platform**: Single-page application (SPA)

### Authentication Configuration
**Redirect URIs (SPA):**
- `http://localhost:3000` (Development)
- `https://vehicle-rental-dev.company.com` (Staging)
- `https://vehicle-rental.company.com` (Production)

**Logout URL:**
- `http://localhost:3000` (Development)
- `https://vehicle-rental.company.com` (Production)

### API Permissions
- **Microsoft Graph**: User.Read (Delegated)
- **Microsoft Graph**: openid (Delegated)
- **Microsoft Graph**: profile (Delegated)
- **Microsoft Graph**: email (Delegated)

### Required Values for Implementation
After registration, collect these values:
- **Tenant ID** (Directory ID)
- **Client ID** (Application ID) 
- **Authority URL**: `https://login.microsoftonline.com/{tenant-id}`

## Manual Setup Instructions
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Click "New registration"
3. Configure settings as specified above
4. Copy Tenant ID and Client ID for environment variables