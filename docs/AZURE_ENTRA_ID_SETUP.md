# Azure Entra ID Setup Guide

Step-by-step guide to configure Azure Entra ID (formerly Azure AD) for the VehicleRental API authentication and authorization.

## Prerequisites

- Azure subscription with Microsoft Entra ID access
- Azure Portal access with Application Administrator or Global Administrator role

## 1. Create App Registration

1. Go to **Azure Portal** → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name:** `VehicleRental API`
   - **Supported account types:** `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI:** Leave blank (API doesn't need redirect)
4. Click **Register**

After creation, note down from the **Overview** page:
- **Application (client) ID** - e.g., `59f2f452-fcb5-4297-b702-f06230f75c63`
- **Directory (tenant) ID** - e.g., `282eb06d-3a65-48c3-81c3-225d1e9a10f8`

## 2. Expose an API

1. Go to your App registration → **Expose an API**
2. Click **Add** next to "Application ID URI"
3. Accept the default or set: `api://{your-client-id}`
4. Click **Save**

This URI becomes your `Audience` in configuration.

## 3. Create App Roles

1. Go to your App registration → **App roles**
2. Click **Create app role**

### Role 1: User

| Field | Value |
|-------|-------|
| Display name | `User` |
| Allowed member types | `Users/Groups` |
| Value | `User` |
| Description | `Regular users who can rent and return vehicles` |
| Enable this app role | ✅ Checked |

Click **Apply**

### Role 2: Technician

| Field | Value |
|-------|-------|
| Display name | `Technician` |
| Allowed member types | `Users/Groups` |
| Value | `Technician` |
| Description | `Technical staff who can manage vehicle maintenance status` |
| Enable this app role | ✅ Checked |

Click **Apply**

## 4. Assign Users to Roles

1. Go to **Azure Portal** → **Microsoft Entra ID** → **Enterprise applications**
2. Find and select your `VehicleRental API` application
3. Go to **Users and groups**
4. Click **Add user/group**
5. Select:
   - **Users:** Choose the user(s) to assign
   - **Role:** Select `User` or `Technician`
6. Click **Assign**

Repeat for each user that needs access.

## 5. Configure the API

Update `appsettings.json` in `FleetService.Api`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-directory-tenant-id>",
    "ClientId": "<your-application-client-id>",
    "Audience": "api://<your-application-client-id>"
  }
}
```

For local development, you can also use environment variables or `.env` file:

```bash
AZURE_AD_INSTANCE=https://login.microsoftonline.com/
AZURE_AD_TENANT_ID=<your-directory-tenant-id>
AZURE_AD_CLIENT_ID=<your-application-client-id>
AZURE_AD_AUDIENCE=api://<your-application-client-id>
```

## 6. (Optional) Client Application Setup

If you have a frontend application that calls the API:

### 6.1 Create Client App Registration

1. Go to **App registrations** → **New registration**
2. Configure:
   - **Name:** `VehicleRental Frontend`
   - **Supported account types:** `Accounts in this organizational directory only`
   - **Redirect URI:**
     - Type: `Single-page application (SPA)`
     - URI: `http://localhost:3000` (for development)
3. Click **Register**

### 6.2 Add API Permissions

1. Go to the Client App registration → **API permissions**
2. Click **Add a permission**
3. Select **My APIs** → **VehicleRental API**
4. Select **Delegated permissions**
5. Check `user_impersonation` (if you created a scope) or the default permission
6. Click **Add permissions**
7. Click **Grant admin consent for {your org}**

### 6.3 Configure Authentication

1. Go to **Authentication**
2. Under "Implicit grant and hybrid flows", check:
   - ✅ Access tokens
   - ✅ ID tokens
3. Click **Save**

## 7. Testing the Configuration

### Get a Token (using Azure CLI)

```bash
# Login to Azure
az login

# Get token for the API
az account get-access-token --resource api://<your-client-id>
```

### Get a Token (using Postman)

1. Create a new request
2. Go to **Authorization** tab
3. Type: `OAuth 2.0`
4. Configure:
   - Grant Type: `Authorization Code`
   - Auth URL: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize`
   - Token URL: `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`
   - Client ID: `{your-client-id}`
   - Scope: `api://{your-client-id}/.default`
5. Click **Get New Access Token**

### Verify Token Contains Roles

Decode the JWT at [jwt.ms](https://jwt.ms) and verify:

```json
{
  "roles": ["User"]  // or ["Technician"]
}
```

## Troubleshooting

### Token doesn't contain roles

1. Verify app roles are created correctly in App Registration
2. Verify user is assigned to a role in Enterprise Applications
3. Wait a few minutes for role assignment to propagate
4. Request a new token

### 401 Unauthorized

1. Verify `TenantId`, `ClientId`, and `Audience` match Azure configuration
2. Check token is not expired
3. Verify token `aud` claim matches your `Audience` setting

### 403 Forbidden

1. User is authenticated but lacks required role
2. Assign appropriate role to user in Enterprise Applications

## Configuration Reference

| Setting | Description | Example |
|---------|-------------|---------|
| `Instance` | Azure login endpoint | `https://login.microsoftonline.com/` |
| `TenantId` | Your Azure AD tenant ID | `282eb06d-3a65-48c3-81c3-225d1e9a10f8` |
| `ClientId` | App registration client ID | `59f2f452-fcb5-4297-b702-f06230f75c63` |
| `Audience` | Expected token audience | `api://59f2f452-fcb5-4297-b702-f06230f75c63` |

## Related Documentation

- [ROLE_BASED_ACCESS_IMPLEMENTATION.md](./ROLE_BASED_ACCESS_IMPLEMENTATION.md) - API authorization implementation details
- [Microsoft Entra ID Documentation](https://learn.microsoft.com/en-us/entra/identity/)
- [ASP.NET Core Authentication with Azure AD](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/azure-active-directory/)
