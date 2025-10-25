# Azure Entra ID Authentication Implementation Blueprint

## **Executive Summary**

This blueprint provides a comprehensive, production-ready implementation plan for integrating Azure Entra ID OAuth 2.0 authentication into the Vehicle Rental System. The solution follows Microsoft's best practices and enterprise security standards.

**Target Architecture**: React SPA with .NET 8 API using MSAL library and JWT Bearer authentication.

---

## **📋 Prerequisites Checklist**

### **Azure Entra ID Setup**
- [ ] Azure subscription with Entra ID tenant
- [ ] Application registration created in Azure Portal
- [ ] API permissions configured (User.Read, openid, profile, email)
- [ ] Redirect URIs configured for all environments
- [ ] Client secrets generated (for backend API validation)

### **Development Environment**
- [ ] Node.js 18+ and npm/yarn installed
- [ ] .NET 8 SDK installed
- [ ] Azure CLI installed and authenticated
- [ ] Visual Studio Code with Azure extensions

---

## **🏗️ Solution Architecture**

### **Authentication Flow Diagram**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │────│   Azure Entra    │────│   .NET 8 API   │
│                 │    │   ID (OAuth)     │    │                 │
│ • MSAL React    │    │ • OIDC Provider  │    │ • JWT Bearer    │
│ • Secure Storage│    │ • Token Issuer   │    │ • Token Valid.  │
│ • Auto Refresh  │    │ • User Profile   │    │ • Claims Extract│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └─── JWT Access Token ──┴───── API Calls ──────┘
```

### **Component Dependencies**
```
Frontend (React)
├── @azure/msal-react (2.0.x)
├── @azure/msal-browser (3.x)
├── axios (1.x) - with interceptors
└── @types/react (19.x)

Backend (.NET 8)
├── Microsoft.AspNetCore.Authentication.JwtBearer (8.x)
├── Microsoft.Identity.Web (2.x)
└── System.IdentityModel.Tokens.Jwt (7.x)
```

---

## **⚙️ Environment Configuration**

### **Frontend Environment Variables**
```bash
# .env.local (Development)
REACT_APP_AZURE_TENANT_ID=12345678-1234-1234-1234-123456789012
REACT_APP_AZURE_CLIENT_ID=87654321-4321-4321-4321-210987654321
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
REACT_APP_AZURE_SCOPES=User.Read,openid,profile,email
REACT_APP_API_BASE_URL=https://localhost:5001

# .env.production (Production)
REACT_APP_AZURE_TENANT_ID=prod-tenant-id
REACT_APP_AZURE_CLIENT_ID=prod-client-id
REACT_APP_AZURE_REDIRECT_URI=https://vehicle-rental.company.com
REACT_APP_AZURE_SCOPES=User.Read,openid,profile,email
REACT_APP_API_BASE_URL=https://api.vehicle-rental.company.com
```

### **Backend Configuration**
```json
// appsettings.json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "12345678-1234-1234-1234-123456789012",
    "ClientId": "87654321-4321-4321-4321-210987654321",
    "Audience": "87654321-4321-4321-4321-210987654321"
  },
  "Logging": {
    "LogLevel": {
      "Microsoft.AspNetCore.Authentication": "Information"
    }
  }
}
```

---

## **🔧 Implementation Plan**

### **Phase 1: Frontend Authentication Setup (Week 1)**

#### **Step 1.1: Install Dependencies**
```bash
cd src/web/vehicle-rental-web
npm install @azure/msal-react@^2.0.0 @azure/msal-browser@^3.0.0
npm install --save-dev @types/node
```

#### **Step 1.2: MSAL Configuration**
Create `src/auth/msalConfig.ts`:
```typescript
import { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI,
    postLogoutRedirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === 'development' ? 3 : 1
    }
  }
};

export const loginRequest: PopupRequest = {
  scopes: process.env.REACT_APP_AZURE_SCOPES?.split(',') || ['User.Read'],
  prompt: 'select_account'
};

export const tokenRequest = {
  scopes: ['User.Read'],
  forceRefresh: false
};
```

#### **Step 1.3: Authentication Context**
Create `src/auth/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { AccountInfo } from '@azure/msal-browser';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const login = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI,
        mainWindowRedirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated || accounts.length === 0) {
      return null;
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...tokenRequest,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      try {
        const response = await instance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Popup token acquisition failed:', popupError);
        return null;
      }
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user: accounts[0] || null,
    login,
    logout,
    getAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### **Step 1.4: Authentication Components**
Create `src/components/AuthButton.tsx`:
```typescript
import React from 'react';
import { useAuth } from '../auth/AuthContext';

export const AuthButton: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#333', fontSize: '14px' }}>
          Welcome, {user.name || user.username}
        </span>
        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      style={{
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px'
      }}
    >
      {loading ? 'Signing in...' : 'Sign In'}
    </button>
  );
};
```

#### **Step 1.5: Update Main App**
Update `src/App.tsx`:
```typescript
import React from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { AuthProvider } from './auth/AuthContext';
import { AuthButton } from './components/AuthButton';
import { VehicleApp } from './components/VehicleApp';
import { msalConfig } from './auth/msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <div className="App">
          <header style={{
            padding: '16px 20px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, color: '#333' }}>🚗 Vehicle Rental System</h1>
            <AuthButton />
          </header>
          <VehicleApp />
        </div>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;
```

### **Phase 2: API Integration (Week 2)**

#### **Step 2.1: Axios Interceptor Setup**
Create `src/services/httpClient.ts`:
```typescript
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '../auth/AuthContext';

const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const useAuthenticatedHttpClient = () => {
  const { getAccessToken, isAuthenticated } = useAuth();

  React.useEffect(() => {
    const requestInterceptor = httpClient.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        if (isAuthenticated) {
          const token = await getAccessToken();
          if (token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${token}`
            };
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401 && isAuthenticated) {
          // Token might be expired, try to refresh
          try {
            const token = await getAccessToken();
            if (token) {
              // Retry the original request with new token
              error.config.headers.Authorization = `Bearer ${token}`;
              return httpClient.request(error.config);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      httpClient.interceptors.request.eject(requestInterceptor);
      httpClient.interceptors.response.eject(responseInterceptor);
    };
  }, [getAccessToken, isAuthenticated]);

  return httpClient;
};

export default httpClient;
```

#### **Step 2.2: Update Vehicle Service**
Update `src/services/vehicleService.ts`:
```typescript
import httpClient from './httpClient';
import { Vehicle } from '../types/vehicle';

export const vehicleService = {
  getNearbyVehicles: async (
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<Vehicle[]> => {
    const response = await httpClient.get(`/api/vehicles/nearby`, {
      params: { latitude, longitude, radius }
    });
    return response.data;
  },

  updateVehicleStatus: async (
    vehicleId: string,
    status: string
  ): Promise<Vehicle> => {
    const response = await httpClient.put(`/api/vehicles/${vehicleId}/status`, {
      status
    });
    return response.data;
  },

  getUserVehicles: async (): Promise<Vehicle[]> => {
    const response = await httpClient.get('/api/vehicles/user');
    return response.data;
  },

  rentVehicle: async (vehicleId: string): Promise<void> => {
    await httpClient.post(`/api/vehicles/${vehicleId}/rent`);
  },

  returnVehicle: async (vehicleId: string): Promise<void> => {
    await httpClient.post(`/api/vehicles/${vehicleId}/return`);
  }
};
```

### **Phase 3: Backend Authentication (Week 3)**

#### **Step 3.1: Install NuGet Packages**
```bash
cd src/services/FleetService/FleetService.Api
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.Identity.Web
```

#### **Step 3.2: Update Program.cs**
```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Add authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AuthenticatedUser", policy =>
        policy.RequireAuthenticatedUser());
});

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://vehicle-rental.company.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
```

#### **Step 3.3: Update Vehicle Controller**
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication for all endpoints
public class VehiclesController : ControllerBase
{
    private readonly IVehicleQueryService _vehicleQueryService;
    private readonly IVehicleCommandService _vehicleCommandService;

    public VehiclesController(
        IVehicleQueryService vehicleQueryService,
        IVehicleCommandService vehicleCommandService)
    {
        _vehicleQueryService = vehicleQueryService;
        _vehicleCommandService = vehicleCommandService;
    }

    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyVehicles(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radius = 5)
    {
        var userId = GetUserId();
        var result = await _vehicleQueryService.GetNearbyVehiclesAsync(
            latitude, longitude, radius, userId);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserVehicles()
    {
        var userId = GetUserId();
        var result = await _vehicleQueryService.GetUserVehiclesAsync(userId);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id}/rent")]
    public async Task<IActionResult> RentVehicle(string id)
    {
        var userId = GetUserId();
        var result = await _vehicleCommandService.RentVehicleAsync(id, userId);

        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("oid")?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");
    }

    private string GetUserEmail()
    {
        return User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("preferred_username")?.Value
            ?? "unknown@example.com";
    }

    private string GetUserName()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value
            ?? "Unknown User";
    }
}
```


---

## **🔒 Security Best Practices**

### **Token Security**
- ✅ **Use MSAL's built-in secure storage** - Never manually store tokens
- ✅ **Implement token refresh** - Automatic and transparent to users
- ✅ **Use HTTPS only** - All communication encrypted
- ✅ **Configure CORS properly** - Restrict origins to known domains
- ✅ **Validate tokens server-side** - Never trust client-side validation

### **Authentication Flow Security**
- ✅ **Use Authorization Code Flow with PKCE** - No client secrets in browser
- ✅ **Implement proper logout** - Clear all tokens and sessions
- ✅ **Handle token expiration gracefully** - Automatic refresh or re-authentication
- ✅ **Validate redirect URIs** - Prevent token hijacking
- ✅ **Use secure headers** - CSP, HSTS, X-Frame-Options

### **Error Handling Security**
- ✅ **Don't expose sensitive information** - Generic error messages to users
- ✅ **Log security events** - Failed logins, token issues, etc.
- ✅ **Implement rate limiting** - Prevent brute force attacks
- ✅ **Monitor authentication metrics** - Unusual patterns or failures

---

## **🧪 Testing Strategy**

### **Unit Tests**
```typescript
// src/auth/__tests__/AuthContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { AuthProvider, useAuth } from '../AuthContext';

const mockMsalInstance = new PublicClientApplication({
  auth: { clientId: 'test-client-id' }
});

const TestComponent = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-name">{user?.name || 'No User'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  test('provides authentication state', async () => {
    render(
      <MsalProvider instance={mockMsalInstance}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MsalProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });
});
```

### **Integration Tests**
```csharp
// tests/integration/FleetService.IntegrationTests/AuthenticationTests.cs
[Collection("Integration")]
public class AuthenticationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthenticationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetVehicles_WithoutAuthentication_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/vehicles/nearby?latitude=40.7128&longitude=-74.0060");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetVehicles_WithValidToken_ReturnsSuccess()
    {
        var token = await GetValidTestToken();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/vehicles/nearby?latitude=40.7128&longitude=-74.0060");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### **E2E Tests**
```typescript
// e2e/auth.spec.ts (Playwright/Cypress)
test('complete authentication flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Should show sign in button
  await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

  // Click sign in
  await page.click('button:has-text("Sign In")');

  // Should redirect to Microsoft login
  await expect(page).toHaveURL(/login\.microsoftonline\.com/);

  // Login with test credentials
  await page.fill('input[type="email"]', 'test@company.com');
  await page.click('input[type="submit"]');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('input[type="submit"]');

  // Should redirect back to app
  await expect(page).toHaveURL('http://localhost:3000');

  // Should show user name and sign out button
  await expect(page.locator('text=Welcome')).toBeVisible();
  await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
});
```

---

## **📊 Performance Optimization**

### **Frontend Optimizations**
- **Lazy Loading**: Load MSAL library only when needed
- **Token Caching**: Leverage MSAL's intelligent caching
- **Silent Refresh**: Background token renewal without user interaction
- **Connection Pooling**: Reuse HTTP connections for API calls

### **Backend Optimizations**
- **JWT Validation Caching**: Cache public keys for token validation
- **Claims Caching**: Cache user claims to reduce token parsing
- **Connection Pooling**: Optimize database connections
- **Response Caching**: Cache user profile data appropriately

### **Network Optimizations**
- **CDN Usage**: Serve static assets from CDN
- **Compression**: Enable gzip/brotli compression
- **HTTP/2**: Use HTTP/2 for multiplexing
- **Preloading**: Preload critical authentication resources

---

## **🚀 Deployment Guide**

### **Azure App Registration Configuration**
```json
{
  "displayName": "Vehicle Rental System",
  "signInAudience": "AzureADMyOrg",
  "web": {
    "redirectUris": [
      "http://localhost:3000",
      "https://vehicle-rental-dev.company.com",
      "https://vehicle-rental.company.com"
    ],
    "logoutUrl": "https://vehicle-rental.company.com/logout"
  },
  "spa": {
    "redirectUris": [
      "http://localhost:3000",
      "https://vehicle-rental.company.com"
    ]
  },
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
          "type": "Scope"
        }
      ]
    }
  ]
}
```

### **Environment-Specific Configurations**

**Development:**
```bash
REACT_APP_AZURE_TENANT_ID=dev-tenant-id
REACT_APP_AZURE_CLIENT_ID=dev-client-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
```

**Staging:**
```bash
REACT_APP_AZURE_TENANT_ID=staging-tenant-id
REACT_APP_AZURE_CLIENT_ID=staging-client-id
REACT_APP_AZURE_REDIRECT_URI=https://vehicle-rental-staging.company.com
```

**Production:**
```bash
REACT_APP_AZURE_TENANT_ID=prod-tenant-id
REACT_APP_AZURE_CLIENT_ID=prod-client-id
REACT_APP_AZURE_REDIRECT_URI=https://vehicle-rental.company.com
```

### **CI/CD Pipeline Configuration**
```yaml
# .github/workflows/deploy.yml
name: Deploy Vehicle Rental System

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: src/web/vehicle-rental-web

      - name: Build application
        run: npm run build
        working-directory: src/web/vehicle-rental-web
        env:
          REACT_APP_AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          REACT_APP_AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          REACT_APP_AZURE_REDIRECT_URI: ${{ secrets.AZURE_REDIRECT_URI }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "src/web/vehicle-rental-web/build"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'

      - name: Build application
        run: dotnet build src/services/VehicleRentalSystem.sln

      - name: Run tests
        run: dotnet test src/services/VehicleRentalSystem.sln

      - name: Deploy to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          resource-group: ${{ secrets.AZURE_RESOURCE_GROUP }}
          container-app-name: vehicle-rental-api
          container-image: vehiclerental.azurecr.io/api:${{ github.sha }}
```

---

## **📈 Monitoring & Observability**

### **Application Insights Integration**
```typescript
// src/telemetry/appInsights.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.REACT_APP_APPINSIGHTS_KEY,
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true
  }
});

appInsights.loadAppInsights();

export const trackAuthenticationEvent = (eventName: string, properties?: any) => {
  appInsights.trackEvent({
    name: `Authentication_${eventName}`,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties
    }
  });
};

export const trackAuthenticationError = (error: any, properties?: any) => {
  appInsights.trackException({
    exception: error,
    properties: {
      category: 'Authentication',
      timestamp: new Date().toISOString(),
      ...properties
    }
  });
};
```

### **Health Checks**
```csharp
// FleetService.Api/HealthChecks/AuthenticationHealthCheck.cs
public class AuthenticationHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public AuthenticationHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantId = _configuration["AzureAd:TenantId"];
            var clientId = _configuration["AzureAd:ClientId"];

            if (string.IsNullOrEmpty(tenantId) || string.IsNullOrEmpty(clientId))
            {
                return HealthCheckResult.Unhealthy("Azure AD configuration is missing");
            }

            // Verify Azure AD metadata endpoint is accessible
            using var httpClient = new HttpClient();
            var metadataUrl = $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid_configuration";
            var response = await httpClient.GetAsync(metadataUrl, cancellationToken);

            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("Azure AD configuration is valid")
                : HealthCheckResult.Degraded("Azure AD metadata endpoint is not accessible");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Authentication health check failed", ex);
        }
    }
}
```

---

## **🔄 Maintenance & Updates**

### **Regular Maintenance Tasks**
- **Weekly**: Review authentication logs and metrics
- **Monthly**: Update MSAL libraries to latest stable versions
- **Quarterly**: Rotate client secrets (if using confidential client)
- **Annually**: Review and update Azure AD app registration permissions

### **Security Updates**
- Monitor Microsoft security advisories
- Update authentication libraries promptly
- Review and update CORS policies
- Audit user permissions and access patterns

### **Performance Monitoring**
- Track authentication success/failure rates
- Monitor token refresh frequency
- Measure authentication flow completion times
- Analyze user experience metrics

---

## **📚 Documentation & Training**

### **Developer Documentation**
- API authentication requirements
- Frontend integration patterns
- Error handling procedures
- Testing guidelines

### **Operations Documentation**
- Deployment procedures
- Configuration management
- Monitoring and alerting setup
- Incident response procedures

### **User Documentation**
- Login instructions
- Troubleshooting common issues
- Browser compatibility requirements
- Privacy and security information

---

## **✅ Implementation Checklist**

### **Phase 1: Frontend Setup**
- [ ] Install MSAL React packages
- [ ] Configure environment variables
- [ ] Implement MSAL configuration
- [ ] Create authentication context
- [ ] Build authentication components
- [ ] Update main App component
- [ ] Test login/logout flow

### **Phase 2: API Integration**
- [ ] Create HTTP client with interceptors
- [ ] Update vehicle service
- [ ] Test authenticated API calls
- [ ] Implement error handling
- [ ] Test token refresh scenarios

### **Phase 3: Backend Authentication**
- [ ] Install JWT Bearer packages
- [ ] Configure authentication middleware
- [ ] Update controllers with authorization
- [ ] Implement user claim extraction
- [ ] Test API security
- [ ] Configure CORS policies


### **Phase 5: Testing & Deployment**
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Configure CI/CD pipeline
- [ ] Deploy to staging environment
- [ ] Perform security testing
- [ ] Deploy to production

### **Phase 6: Monitoring & Documentation**
- [ ] Configure Application Insights
- [ ] Set up health checks
- [ ] Create monitoring dashboards
- [ ] Write operation procedures
- [ ] Create user documentation
- [ ] Train support team

---

## **🎯 Success Metrics**

### **Technical Metrics**
- **Authentication Success Rate**: > 99.5%
- **Token Refresh Success Rate**: > 99.9%
- **Authentication Flow Completion Time**: < 3 seconds
- **API Response Time with Auth**: < 500ms additional overhead

### **Security Metrics**
- **Zero** stored credentials in client-side code
- **Zero** hardcoded configuration values
- **100%** HTTPS communication
- **Zero** security vulnerabilities in dependencies

### **User Experience Metrics**
- **User Satisfaction**: > 4.5/5 for authentication experience
- **Support Tickets**: < 1% related to authentication issues
- **Session Duration**: No decrease due to authentication friction
- **Conversion Rate**: No impact on user engagement

---

## **📞 Support & Troubleshooting**

### **Common Issues & Solutions**

**Issue**: CORS errors during authentication
**Solution**: Verify redirect URIs in Azure AD and CORS configuration

**Issue**: Token refresh failures
**Solution**: Check token expiration settings and refresh token configuration

**Issue**: Claims not available in API
**Solution**: Verify token audience and scope configuration


### **Escalation Procedures**
1. **Level 1**: Development team reviews logs and configuration
2. **Level 2**: Azure AD administrator checks tenant configuration
3. **Level 3**: Microsoft support for Azure AD platform issues

### **Useful Resources**
- [MSAL React Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-react-overview)
- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [JWT.io](https://jwt.io/) for token debugging

---

**Document Version**: 1.0
**Last Updated**: 2024-10-24
**Next Review**: 2024-11-24

*This blueprint serves as the definitive guide for implementing Azure Entra ID authentication in the Vehicle Rental System. All implementation decisions should reference this document to ensure consistency and best practices.*