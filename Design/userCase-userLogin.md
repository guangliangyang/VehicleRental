# User Case: Azure Entra ID Authentication for Vehicle Rental System

## **Business Context**
The Vehicle Rental System currently allows anonymous access to view vehicles and their locations. Adding Azure Entra ID authentication will enable user identification, personalized experiences, and future features like rental history and user preferences.

## **Current System Architecture Analysis**
- **Frontend**: React 19.2.0 + TypeScript SPA
- **Backend**: .NET 8 Clean Architecture with Fleet Service API
- **Database**: Azure Cosmos DB for vehicle data
- **Real-time**: SignalR for live vehicle updates
- **Infrastructure**: Azure services with Key Vault integration

## **Detailed Requirements**

### **Functional Requirements**

**FR1: User Authentication Flow**
- **Input**: User clicks "Login" button
- **Process**: Redirect to Azure Entra ID OAuth 2.0 endpoint
- **Output**: User authenticated with JWT access token
- **Display**: Username shown in header after successful login

**FR2: Protected Vehicle Operations**
- **Input**: Authenticated user requests vehicle data
- **Process**: Include JWT token in API calls to Fleet Service
- **Output**: Vehicle data returned with user context
- **Future**: Enable user-specific operations (rentals, favorites)

**FR3: Session Management**
- **Input**: User session state changes
- **Process**: Handle token refresh, logout, session expiration
- **Output**: Maintain authentication state across browser tabs

### **Non-Functional Requirements**

**NFR1: Security**
- OAuth 2.0 Authorization Code Flow with PKCE (no client secrets in browser)
- JWT tokens with appropriate expiration (1 hour access, 24 hour refresh)
- Secure token storage using browser secure storage
- HTTPS-only communication

**NFR2: Performance**
- Authentication should not impact vehicle map loading performance
- Token refresh should be transparent to user
- Minimal authentication-related network calls

**NFR3: User Experience**
- Single Sign-On (SSO) experience with corporate Azure AD
- Seamless authentication without disrupting vehicle browsing
- Clear authentication status indicators

## **Detailed Use Cases**

### **Use Case 1: Initial Login**
```
Primary Actor: End User
Preconditions: User has valid Azure Entra ID credentials
Trigger: User clicks "Login" button

Main Flow:
1. User clicks "Login" in vehicle rental app header
2. System redirects to Azure Entra ID authorization endpoint
3. User enters credentials on Microsoft login page
4. Azure Entra ID validates credentials
5. User consents to application permissions (if first time)
6. Azure Entra ID redirects back with authorization code
7. MSAL library exchanges code for JWT tokens
8. System stores tokens securely
9. System retrieves user profile information
10. Header displays "Welcome, [Username]" with logout option
11. User can now access vehicle features as authenticated user

Success Outcome: User is logged in, username displayed, tokens stored
Failure Outcomes:
- Invalid credentials → Show error, stay on login
- Network error → Show retry option
- Consent denied → Show explanation and retry option
```

### **Use Case 2: API Calls with Authentication**
```
Primary Actor: Authenticated User
Preconditions: User is logged in with valid tokens
Trigger: User interacts with vehicle features (map, list, filters)

Main Flow:
1. User performs action requiring API call (e.g., load vehicles)
2. System checks if access token is valid and not expired
3. System includes JWT token in Authorization header
4. Fleet Service API validates JWT token
5. API returns vehicle data with user context
6. Frontend displays data with personalized features

Success Outcome: API call succeeds with user-specific data
Failure Outcomes:
- Token expired → Auto-refresh token and retry
- Token invalid → Force re-authentication
- API error → Display error message, maintain auth state
```

### **Use Case 3: Token Refresh**
```
Primary Actor: System (automatic)
Preconditions: Access token is expired, refresh token is valid
Trigger: Access token expires during user session

Main Flow:
1. System detects expired access token on API call
2. System uses refresh token to request new access token
3. Azure Entra ID validates refresh token
4. New access token returned and stored
5. Original API call retried with new token
6. User continues normal operation without interruption

Success Outcome: Seamless token refresh, user unaware
Failure Outcomes:
- Refresh token expired → Force re-authentication
- Network error → Show offline mode, queue requests
```

### **Use Case 4: Multi-Tab Synchronization**
```
Primary Actor: End User
Preconditions: User has multiple browser tabs open
Trigger: User logs in/out in one tab

Main Flow:
1. User performs authentication action in Tab A
2. System updates authentication state in local storage
3. Other tabs detect state change via storage events
4. All tabs update UI to reflect new authentication state
5. All tabs sync token state and user information

Success Outcome: Consistent auth state across all tabs
Failure Outcomes: Manual refresh required if sync fails
```

## **Input/Output Specifications**

### **Configuration Inputs**
```typescript
interface AzureEntraConfig {
  tenantId: string;           // Azure Tenant ID
  clientId: string;           // Application Registration ID
  redirectUri: string;        // OAuth callback URL
  scopes: string[];          // ['User.Read', 'openid', 'profile', 'email']
  authority: string;         // https://login.microsoftonline.com/{tenantId}
}
```

### **Authentication Outputs**
```typescript
interface AuthenticationResult {
  accessToken: string;        // JWT for API calls
  refreshToken: string;       // For token renewal
  expiresOn: Date;           // Token expiration
  account: {
    username: string;        // Display name
    homeAccountId: string;   // Unique user ID
    environment: string;     // Azure environment
  };
}

interface UserProfile {
  displayName: string;       // "John Doe"
  userPrincipalName: string; // "john.doe@company.com"
  id: string;               // Azure AD object ID
  jobTitle?: string;        // Optional profile info
  department?: string;      // Optional profile info
}
```

## **Exception Handling & Edge Cases**

### **Authentication Exceptions**
1. **Invalid Credentials**
   - Error: "AADSTS50126: Invalid username or password"
   - Handling: Show user-friendly error, allow retry
   - Recovery: Clear any cached tokens, restart auth flow

2. **Consent Required**
   - Error: "AADSTS65001: The user or administrator has not consented"
   - Handling: Redirect to consent flow
   - Recovery: Re-attempt authentication after consent

3. **Multi-Factor Authentication**
   - Error: "AADSTS50076: Due to a configuration change or enrollment"
   - Handling: Redirect to MFA challenge
   - Recovery: Complete MFA, continue normal flow

### **Token Management Edge Cases**
1. **Simultaneous Token Refresh**
   - Scenario: Multiple API calls trigger refresh simultaneously
   - Handling: Queue requests, single refresh operation
   - Recovery: Retry queued requests with new token

2. **Browser Storage Limitations**
   - Scenario: Private browsing or storage disabled
   - Handling: Use session storage or memory storage
   - Recovery: Graceful degradation with re-auth on refresh

3. **Clock Skew Issues**
   - Scenario: Client/server time mismatch affects token validation
   - Handling: Add buffer time for token expiration checks
   - Recovery: Force refresh if validation fails

### **Network & Infrastructure Edge Cases**
1. **Azure Entra ID Service Outage**
   - Scenario: Microsoft authentication services unavailable
   - Handling: Show service unavailable message
   - Recovery: Implement retry with exponential backoff

2. **Corporate Firewall/Proxy**
   - Scenario: Network restrictions block OAuth redirects
   - Handling: Provide alternative authentication methods
   - Recovery: IT admin configuration guidance

3. **Cross-Origin Resource Sharing (CORS)**
   - Scenario: Browser blocks OAuth redirects
   - Handling: Proper CORS configuration documentation
   - Recovery: Verify redirect URI configuration

## **Integration Points with Current Architecture**

### **Frontend Integration**
```typescript
// App.tsx modification
<AuthProvider>
  <AuthenticatedApp />
</AuthProvider>

// Vehicle service with auth
const vehicleService = {
  getNearbyVehicles: async (lat, lng, radius) => {
    const token = await getAccessToken();
    return axios.get('/api/vehicles/nearby', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
```

### **Backend API Integration**
```csharp
// Fleet Service API authentication middleware
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = "https://login.microsoftonline.com/{tenantId}";
            options.Audience = "{clientId}";
        });
}
```

### **SignalR Integration**
```typescript
// Authenticated SignalR connection
const connection = new HubConnectionBuilder()
  .withUrl('/hubs/vehicles', {
    accessTokenFactory: () => getAccessToken()
  })
  .build();
```

## **Testing Scenarios**

### **Happy Path Tests**
1. First-time login → Consent → Profile display
2. Returning user login → Immediate access
3. Token refresh during active session
4. Logout → Clear state → Login again

### **Error Path Tests**
1. Invalid credentials → Error display → Retry
2. Network failure during auth → Offline handling
3. Token expiration → Auto-refresh → Continue
4. Browser refresh during auth flow → Recovery

### **Security Tests**
1. Token storage security verification
2. HTTPS-only communication validation
3. XSS protection with token handling
4. CSRF protection verification

## **Success Criteria**
1. **Functional**: Users can login/logout with Azure Entra ID credentials
2. **Security**: All API calls properly authenticated with JWT tokens
3. **Performance**: Authentication adds <2 seconds to initial load
4. **Reliability**: 99.9% authentication success rate for valid credentials
5. **Usability**: Clear authentication status and error messages

## **Implementation Considerations**

### **MSAL Library Choice**
- **Recommended**: `@azure/msal-react` + `@azure/msal-browser`
- **Rationale**: Official Microsoft library with React hooks integration
- **Benefits**: Automatic token refresh, secure storage, TypeScript support

### **Configuration Management**
- Store Azure Entra ID configuration in environment variables
- Use different configurations for development/staging/production
- Implement configuration validation on startup

### **Error Monitoring**
- Integrate with Application Insights for authentication error tracking
- Monitor token refresh rates and failure patterns
- Track authentication flow completion rates

### **Deployment Considerations**
- Update Azure App Registration with production redirect URIs
- Configure CORS policies for authentication endpoints
- Implement proper CSP headers for security
- Plan for zero-downtime deployment with authentication state

This comprehensive user case provides the foundation for implementing Azure Entra ID authentication while considering all aspects of the current Vehicle Rental System architecture.