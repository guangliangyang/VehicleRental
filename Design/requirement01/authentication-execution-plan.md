# Azure Entra ID Authentication - Step-by-Step Execution Plan

## **Overview**
This execution plan breaks down the comprehensive authentication solution into small, verifiable steps. Each step includes clear deliverables, verification criteria, and acceptance tests.

**Reference**: [Authentication Implementation Blueprint](./authentication-implementation-blueprint.md)

---

## **📋 Execution Phases**

### **Phase 1: Environment & Dependencies Setup**
*Duration: 1-2 days*

### **Phase 2: Frontend Authentication Foundation**
*Duration: 2-3 days*

### **Phase 3: API Integration & Testing**
*Duration: 2-3 days*

### **Phase 4: Backend Authentication**
*Duration: 2-3 days*

### **Phase 5: Testing & Deployment**
*Duration: 2-3 days*

---

## **Phase 1: Environment & Dependencies Setup**

### **Step 1.1: Azure Entra ID Application Registration**
**Duration**: 30 minutes
**Owner**: DevOps/Azure Admin

**Tasks:**
1. Create new App Registration in Azure Portal
2. Configure authentication settings
3. Set up API permissions
4. Generate client secrets (if needed)

**Deliverables:**
- Azure App Registration with configured settings
- Tenant ID, Client ID documented
- Redirect URIs configured for all environments

**Verification Criteria:**
```bash
# Test app registration exists
az ad app show --id <client-id>

# Verify redirect URIs
az ad app show --id <client-id> --query "web.redirectUris"
```

**Acceptance Test:**
- [ ] App registration visible in Azure Portal
- [ ] Redirect URIs include localhost:3000 and production URLs
- [ ] API permissions include User.Read scope
- [ ] Application type set to "Single Page Application"

---

### **Step 1.2: Environment Variables Setup**
**Duration**: 15 minutes
**Owner**: Developer

**Tasks:**
1. Create .env.local file for development
2. Document environment variables for other environments
3. Add .env.local to .gitignore

**Deliverables:**
```bash
# src/web/vehicle-rental-web/.env.local
REACT_APP_AZURE_TENANT_ID=your-tenant-id
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
REACT_APP_AZURE_SCOPES=User.Read,openid,profile,email
REACT_APP_API_BASE_URL=https://localhost:5001
```

**Verification Criteria:**
```bash
# Check file exists and variables are set
cat src/web/vehicle-rental-web/.env.local
grep -E "REACT_APP_AZURE_" src/web/vehicle-rental-web/.env.local
```

**Acceptance Test:**
- [ ] .env.local file created with all required variables
- [ ] .env.local added to .gitignore
- [ ] Environment variables follow naming convention
- [ ] No secrets committed to repository

---

### **Step 1.3: Install Frontend Dependencies**
**Duration**: 10 minutes
**Owner**: Developer

**Tasks:**
1. Install MSAL React packages
2. Install type definitions
3. Update package.json

**Deliverables:**
```bash
cd src/web/vehicle-rental-web
npm install @azure/msal-react@^2.0.0 @azure/msal-browser@^3.0.0
npm install --save-dev @types/node
```

**Verification Criteria:**
```bash
# Check packages installed
npm list @azure/msal-react @azure/msal-browser
grep -E "@azure/msal" package.json
```

**Acceptance Test:**
- [ ] MSAL packages installed with correct versions
- [ ] No dependency conflicts reported
- [ ] Application still builds successfully: `npm run build`
- [ ] No security vulnerabilities: `npm audit`

---

### **Step 1.4: Install Backend Dependencies**
**Duration**: 10 minutes
**Owner**: Developer

**Tasks:**
1. Install JWT Bearer authentication package
2. Install Microsoft Identity Web package
3. Verify package installation

**Deliverables:**
```bash
cd src/services/FleetService/FleetService.Api
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.Identity.Web
```

**Verification Criteria:**
```bash
# Check packages installed
dotnet list package | grep -E "(JwtBearer|Identity.Web)"
```

**Acceptance Test:**
- [ ] Packages installed successfully
- [ ] Solution still builds: `dotnet build`
- [ ] No package conflicts or warnings
- [ ] All tests pass: `dotnet test`

---

## **Phase 2: Frontend Authentication Foundation**

### **Step 2.1: Create MSAL Configuration**
**Duration**: 30 minutes
**Owner**: Developer

**Tasks:**
1. Create auth directory structure
2. Implement MSAL configuration file
3. Add TypeScript types

**Deliverables:**
- `src/auth/msalConfig.ts` - MSAL configuration
- Environment variable integration
- TypeScript type definitions

**File Structure:**
```
src/
├── auth/
│   ├── msalConfig.ts
│   └── types.ts
```

**Verification Criteria:**
```typescript
// Test configuration loads without errors
import { msalConfig } from './auth/msalConfig';
console.log(msalConfig.auth.clientId); // Should not be undefined
```

**Acceptance Test:**
- [ ] Configuration file created with proper TypeScript types
- [ ] Environment variables properly imported
- [ ] No hardcoded values in configuration
- [ ] Application compiles without TypeScript errors
- [ ] Configuration validates at runtime

---

### **Step 2.2: Create Authentication Context**
**Duration**: 45 minutes
**Owner**: Developer

**Tasks:**
1. Implement React context for authentication
2. Create custom hook for authentication state
3. Add error handling

**Deliverables:**
- `src/auth/AuthContext.tsx` - Authentication context provider
- `useAuth()` hook for components
- Error handling for authentication failures

**Verification Criteria:**
```bash
# Test context provides expected interface
npm run type-check
```

**Acceptance Test:**
- [ ] Context provides isAuthenticated, user, login, logout, getAccessToken
- [ ] TypeScript interfaces properly defined
- [ ] Error handling implemented for all methods
- [ ] Hook throws error when used outside provider
- [ ] No memory leaks in context implementation

---

### **Step 2.3: Create Authentication Button Component**
**Duration**: 30 minutes
**Owner**: Developer

**Tasks:**
1. Implement login/logout button component
2. Add loading states
3. Style component to match existing design

**Deliverables:**
- `src/components/AuthButton.tsx` - Authentication button
- Loading states for login/logout
- Error display for authentication failures

**Verification Criteria:**
```bash
# Component renders without errors
npm start
# Navigate to localhost:3000 and verify button appears
```

**Acceptance Test:**
- [ ] Button shows "Sign In" when not authenticated
- [ ] Button shows username and "Sign Out" when authenticated
- [ ] Loading states work correctly
- [ ] Error messages display appropriately
- [ ] Component matches existing design system

---

### **Step 2.4: Integrate MSAL Provider in App**
**Duration**: 20 minutes
**Owner**: Developer

**Tasks:**
1. Wrap App with MsalProvider
2. Wrap App with AuthProvider
3. Add AuthButton to header
4. Test integration

**Deliverables:**
- Updated `src/App.tsx` with MSAL integration
- Authentication button in application header
- Proper provider hierarchy

**Verification Criteria:**
```bash
# Application starts without errors
npm start
# Browser console shows no MSAL errors
```

**Acceptance Test:**
- [ ] Application loads without errors
- [ ] MSAL provider initialized correctly
- [ ] Authentication button visible in header
- [ ] No console errors related to MSAL
- [ ] Existing functionality unaffected

---

### **Step 2.5: Test Basic Authentication Flow**
**Duration**: 30 minutes
**Owner**: Developer/QA

**Tasks:**
1. Test login flow with real Azure AD credentials
2. Verify logout functionality
3. Test error scenarios
4. Document any issues

**Verification Criteria:**
```bash
# Manual testing checklist
# 1. Click "Sign In" button
# 2. Complete Microsoft login flow
# 3. Verify username appears
# 4. Click "Sign Out" button
# 5. Verify button returns to "Sign In"
```

**Acceptance Test:**
- [ ] Login redirects to Microsoft authentication
- [ ] Successful login returns to application
- [ ] Username displays correctly after login
- [ ] Logout clears authentication state
- [ ] Browser refresh maintains authentication state
- [ ] Error handling works for invalid credentials

---

## **Phase 3: API Integration & Testing**

### **Step 3.1: Create HTTP Client with Token Interceptor**
**Duration**: 45 minutes
**Owner**: Developer

**Tasks:**
1. Create authenticated HTTP client
2. Implement request interceptor for tokens
3. Implement response interceptor for token refresh
4. Add error handling

**Deliverables:**
- `src/services/httpClient.ts` - Authenticated HTTP client
- Automatic token injection for requests
- Token refresh on 401 responses
- Comprehensive error handling

**Verification Criteria:**
```typescript
// Test interceptor adds Authorization header
const client = useAuthenticatedHttpClient();
// Mock a request and verify header is added
```

**Acceptance Test:**
- [ ] Request interceptor adds Authorization header when authenticated
- [ ] Response interceptor handles 401 errors appropriately
- [ ] Token refresh works automatically
- [ ] Error handling prevents infinite loops
- [ ] TypeScript types are correctly defined

---

### **Step 3.2: Update Vehicle Service with Authentication**
**Duration**: 30 minutes
**Owner**: Developer

**Tasks:**
1. Update existing vehicle service to use authenticated client
2. Add new authenticated endpoints
3. Maintain backward compatibility

**Deliverables:**
- Updated `src/services/vehicleService.ts`
- New user-specific vehicle operations
- Maintained existing functionality

**Verification Criteria:**
```bash
# Test service compiles and provides expected interface
npm run type-check
```

**Acceptance Test:**
- [ ] All existing vehicle operations still work
- [ ] New authenticated endpoints properly defined
- [ ] TypeScript interfaces updated correctly
- [ ] Error handling implemented for all operations
- [ ] No breaking changes to existing consumers

---

### **Step 3.3: Test API Integration (Mock Backend)**
**Duration**: 30 minutes
**Owner**: Developer

**Tasks:**
1. Set up mock API endpoints for testing
2. Test authenticated requests
3. Test error scenarios
4. Verify token handling

**Deliverables:**
- Mock API server or service worker
- Test cases for authenticated requests
- Error scenario validation

**Verification Criteria:**
```bash
# Start mock server and test requests
npm run test:api-integration
```

**Acceptance Test:**
- [ ] Authenticated requests include proper Authorization header
- [ ] Token refresh triggers on expired tokens
- [ ] Error responses handled correctly
- [ ] Network failures handled gracefully
- [ ] Request/response interceptors work as expected

---

## **Phase 4: Backend Authentication**

### **Step 4.1: Configure JWT Authentication Middleware**
**Duration**: 30 minutes
**Owner**: Developer

**Tasks:**
1. Update Program.cs with JWT authentication
2. Configure Azure AD settings
3. Add CORS configuration
4. Test configuration

**Deliverables:**
- Updated `Program.cs` with authentication middleware
- `appsettings.json` with Azure AD configuration
- CORS policy for frontend

**Verification Criteria:**
```bash
# Application starts without errors
dotnet run --project src/services/FleetService/FleetService.Api
# Check startup logs for authentication configuration
```

**Acceptance Test:**
- [ ] Application starts without configuration errors
- [ ] JWT Bearer authentication registered
- [ ] Azure AD configuration loaded correctly
- [ ] CORS policy allows frontend requests
- [ ] Swagger UI shows authentication options

---

### **Step 4.2: Add Authorization to Vehicle Controller**
**Duration**: 45 minutes
**Owner**: Developer

**Tasks:**
1. Add [Authorize] attributes to controller actions
2. Implement user claim extraction
3. Update methods to use user context
4. Add user-specific operations

**Deliverables:**
- Updated `VehiclesController` with authorization
- User claim extraction methods
- User-specific vehicle operations

**Verification Criteria:**
```bash
# Test endpoints return 401 without authentication
curl -X GET http://localhost:5001/api/vehicles/nearby
# Should return 401 Unauthorized
```

**Acceptance Test:**
- [ ] Unauthenticated requests return 401
- [ ] Authenticated requests work correctly
- [ ] User claims extracted properly
- [ ] User-specific operations implemented
- [ ] Existing functionality preserved

---

### **Step 4.3: Test Backend Authentication**
**Duration**: 30 minutes
**Owner**: Developer/QA

**Tasks:**
1. Test API endpoints without authentication
2. Test API endpoints with valid tokens
3. Test token validation
4. Test error scenarios

**Deliverables:**
- Test cases for authentication scenarios
- Token validation verification
- Error handling validation

**Verification Criteria:**
```bash
# Use Postman/curl to test API with and without tokens
# Get token from frontend and test API directly
```

**Acceptance Test:**
- [ ] Protected endpoints require authentication
- [ ] Valid tokens allow access to protected resources
- [ ] Invalid tokens return appropriate errors
- [ ] Token expiration handled correctly
- [ ] User claims available in controller actions

---

## **Phase 5: Testing & Deployment**

### **Step 6.1: Create Unit Tests**
**Duration**: 2 hours
**Owner**: Developer

**Tasks:**
1. Write tests for authentication context
2. Write tests for HTTP client interceptors
3. Write tests for authentication components
4. Achieve >80% test coverage

**Deliverables:**
- Unit tests for authentication components
- Test coverage reports
- Mocked dependencies for isolated testing

**Verification Criteria:**
```bash
# Run tests and check coverage
npm test -- --coverage
# Coverage should be >80% for auth components
```

**Acceptance Test:**
- [ ] All authentication components have unit tests
- [ ] Test coverage >80% for authentication code
- [ ] Tests use proper mocking for dependencies
- [ ] Tests run successfully in CI pipeline
- [ ] Test suite runs in <30 seconds

---

### **Step 6.2: Create Integration Tests**
**Duration**: 2 hours
**Owner**: Developer

**Tasks:**
1. Write API integration tests with authentication
2. Test authentication middleware
4. Create test data and cleanup

**Deliverables:**
- Integration tests for authenticated API endpoints
- Test setup and teardown procedures
- Test data management

**Verification Criteria:**
```bash
# Run integration tests
dotnet test tests/integration/FleetService.IntegrationTests
# All tests should pass
```

**Acceptance Test:**
- [ ] Integration tests cover all authenticated endpoints
- [ ] Tests use real JWT tokens (with test Azure AD)
- [ ] Test data properly managed
- [ ] Tests run in isolation
- [ ] Test suite completes in <2 minutes

---

### **Step 6.3: Create E2E Tests**
**Duration**: 2 hours
**Owner**: QA/Developer

**Tasks:**
1. Write end-to-end authentication flow tests
2. Test cross-browser compatibility
3. Test error scenarios
4. Automate test execution

**Deliverables:**
- E2E tests for complete authentication flow
- Cross-browser test matrix
- Automated test execution

**Verification Criteria:**
```bash
# Run E2E tests
npm run test:e2e
# Tests should pass in multiple browsers
```

**Acceptance Test:**
- [ ] E2E tests cover complete login/logout flow
- [ ] Tests work in Chrome, Firefox, Safari
- [ ] Error scenarios properly tested
- [ ] Tests can run in CI/CD pipeline
- [ ] Test results clearly reported

---

### **Step 6.4: Performance Testing**
**Duration**: 1 hour
**Owner**: Developer/QA

**Tasks:**
1. Measure authentication flow performance
2. Test token refresh performance
3. Measure API response times with authentication
4. Document performance baseline

**Deliverables:**
- Performance test results
- Baseline metrics documentation
- Performance monitoring setup

**Verification Criteria:**
```bash
# Run performance tests
npm run test:performance
# Authentication should add <2s to initial load
```

**Acceptance Test:**
- [ ] Authentication flow completes in <3 seconds
- [ ] Token refresh adds <500ms overhead
- [ ] API calls with auth have <10% performance impact
- [ ] Memory usage remains stable
- [ ] No memory leaks detected

---

### **Step 6.5: Security Testing**
**Duration**: 1 hour
**Owner**: Security/Developer

**Tasks:**
1. Verify no tokens stored in localStorage
2. Test HTTPS enforcement
3. Verify CORS configuration
4. Test token validation

**Deliverables:**
- Security test checklist
- Vulnerability scan results
- Security configuration validation

**Verification Criteria:**
```bash
# Run security scans
npm audit
# Check for security vulnerabilities
```

**Acceptance Test:**
- [ ] No credentials stored in client-side storage
- [ ] All communication over HTTPS
- [ ] CORS properly configured
- [ ] Token validation working correctly
- [ ] No security vulnerabilities in dependencies

---

### **Step 6.6: Documentation and Deployment**
**Duration**: 2 hours
**Owner**: Developer/DevOps

**Tasks:**
1. Update deployment documentation
2. Configure production environment variables
3. Deploy to staging environment
4. Validate staging deployment

**Deliverables:**
- Updated deployment documentation
- Production configuration templates
- Staging environment validation

**Verification Criteria:**
```bash
# Deploy to staging and test
# All authentication flows should work in staging
```

**Acceptance Test:**
- [ ] Staging deployment successful
- [ ] All authentication flows work in staging
- [ ] Performance meets requirements in staging
- [ ] Security configuration validated
- [ ] Ready for production deployment

---

## **🔄 Verification Workflow**

### **Step Completion Checklist**
For each step, verify:

1. **✅ Deliverables Created**
   - All specified files/changes made
   - Code follows project conventions
   - Documentation updated

2. **✅ Verification Criteria Met**
   - Commands run successfully
   - Tests pass
   - No errors in logs

3. **✅ Acceptance Tests Pass**
   - All checklist items completed
   - Functionality works as expected
   - Performance meets requirements

4. **✅ Code Review Completed**
   - Peer review conducted
   - Security review for auth-related changes
   - Approval from technical lead

5. **✅ Integration Tested**
   - Changes work with existing code
   - No regressions introduced
   - End-to-end flow validated

---

## **🚨 Rollback Procedures**

### **Per-Step Rollback**
Each step should be easily reversible:

```bash
# For frontend changes
git checkout -- src/web/vehicle-rental-web/

# For backend changes
git checkout -- src/services/FleetService/

# For configuration changes
git checkout -- appsettings.json .env.local
```

### **Phase Rollback**
If a phase fails:

1. **Identify failing step**
2. **Rollback to last working commit**
3. **Review and fix issues**
4. **Re-execute from fixed step**

---

## **📊 Progress Tracking**

### **Daily Standup Checklist**
- Which steps completed yesterday?
- Which steps planned for today?
- Any blockers or issues?
- Any changes to timeline?

### **Weekly Review**
- Phase completion status
- Quality metrics (test coverage, performance)
- Security review results
- Documentation updates needed

---

## **🎯 Success Criteria**

### **Phase 1 Success**
- [ ] All dependencies installed
- [ ] Environment configured
- [ ] Azure AD app registration complete

### **Phase 2 Success**
- [ ] Basic authentication flow working
- [ ] Login/logout functionality complete
- [ ] User state management working

### **Phase 3 Success**
- [ ] API calls include authentication
- [ ] Token refresh working
- [ ] Error handling complete

### **Phase 4 Success**
- [ ] Backend validates JWT tokens
- [ ] Protected endpoints working
- [ ] User context available

### **Phase 5 Success**
- [ ] All tests passing
- [ ] Performance requirements met
- [ ] Security validation complete
- [ ] Ready for production deployment

---

**Document Version**: 1.0
**Last Updated**: 2024-10-24
**Next Review**: Weekly during execution

*This execution plan provides step-by-step guidance for implementing Azure Entra ID authentication. Each step is designed to be completed and verified independently, enabling rapid iteration and easy rollback if issues arise.*