# Vehicle Rental System - Technical Architecture Design Guide

## 📖 Document Objectives

This document provides a detailed explanation of the technical architecture design for the Vehicle Rental System, including design patterns, best practices, and implementation details for both the FleetService backend microservice and Vehicle-Rental-Web frontend application. It serves as a comprehensive guide for technical teams and project handovers.

---

## 🏗️ Overall Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Cloud Platform                     │
├─────────────────────┬───────────────────┬───────────────────┤
│   Frontend Layer    │   Backend Layer   │  Infrastructure   │
│                     │                   │      Layer       │
│  ┌───────────────┐  │ ┌───────────────┐ │ ┌───────────────┐ │
│  │ React SPA     │  │ │ FleetService  │ │ │ Azure Cosmos  │ │
│  │ (TypeScript)  │  │ │ (.NET 8 API)  │ │ │ DB            │ │
│  │               │  │ │               │ │ │               │ │
│  │ - MSAL Auth   │  │ │ - Clean Arch  │ │ │ - Geospatial  │ │
│  │ - Role-based  │  │ │ - DDD Pattern │ │ │ - NoSQL       │ │
│  │ - Responsive  │  │ │ - JWT Auth    │ │ │               │ │
│  └───────────────┘  │ └───────────────┘ │ └───────────────┘ │
│                     │                   │                   │
│                     │                   │ ┌───────────────┐ │
│                     │                   │ │ Azure Entra   │ │
│                     │                   │ │ ID (AAD)      │ │
│                     │                   │ │               │ │
│                     │                   │ │ - Identity    │ │
│                     │                   │ │ - Roles       │ │
│                     │                   │ │ - Policies    │ │
│                     │                   │ └───────────────┘ │
└─────────────────────┴───────────────────┴───────────────────┘
```

### Core Technology Stack

| Component | Technology Choice | Version | Purpose |
|-----------|-------------------|---------|---------|
| **Backend Framework** | ASP.NET Core | 8.0 | Web API and Microservices |
| **Frontend Framework** | React | 19.2.0 | Single Page Application (SPA) |
| **Programming Languages** | C# / TypeScript | Latest | Type-safe Development |
| **Database** | Azure Cosmos DB | - | NoSQL Document Database |
| **Identity Management** | Azure Entra ID | - | Enterprise Identity Management |
| **Containerization** | Docker | - | Application Packaging and Deployment |
| **Cloud Platform** | Azure Container Apps | - | Serverless Container Hosting |

---

## 🎯 Design Principles and Patterns

### 1. Clean Architecture

Following Uncle Bob's Clean Architecture layered pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│          (Controllers, API Endpoints, DTOs)            │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                     │
│        (Use Cases, Command/Query Services, Events)     │
├─────────────────────────────────────────────────────────┤
│                     Domain Layer                        │
│        (Entities, Value Objects, Domain Events)        │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                   │
│       (Repositories, External APIs, Database)          │
└─────────────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ **Dependency Inversion**: Inner layers don't depend on outer layers
- ✅ **Business Logic Isolation**: Core business unaffected by technical details
- ✅ **Testability**: Each layer can be tested independently
- ✅ **Maintainability**: Clear structure with well-defined responsibilities

### 2. Domain-Driven Design (DDD)

Implementation of core DDD concepts:

```csharp
// Aggregate Root
public sealed class Vehicle : Entity<string>, IAggregateRoot
{
    // Value Object
    private Location _location;
    private VehicleStatus _status;

    // Domain Methods
    public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
    {
        // Business rule validation
        if (!IsValidStatusTransition(newStatus))
            return Result<VehicleStatus>.Failure(new Error("Invalid transition"));

        _status = newStatus;

        // Domain Event
        RaiseDomainEvent(new VehicleStatusChangedDomainEvent(Id, newStatus));

        return Result<VehicleStatus>.Success(_status);
    }
}
```

### 3. CQRS (Command Query Responsibility Segregation)

Separating read and write operations for performance optimization:

```csharp
// Command Service - Write Operations
public interface IVehicleCommandService
{
    Task<Result<VehicleStatus>> UpdateVehicleStatusAsync(
        string vehicleId,
        VehicleStatus expectedStatus,
        VehicleStatus newStatus,
        CancellationToken cancellationToken);
}

// Query Service - Read Operations
public interface IVehicleQueryService
{
    Task<IReadOnlyList<VehicleSummaryDto>> GetNearbyVehiclesAsync(
        NearbyVehiclesQuery query,
        CancellationToken cancellationToken);
}
```

---

## 🔧 FleetService Backend Architecture Details

### Project Structure

```
FleetService/
├── FleetService.Domain/          # Domain Layer
│   ├── Vehicle.cs               # Vehicle Aggregate Root
│   ├── Location.cs              # Location Value Object
│   ├── VehicleStatus.cs         # Vehicle Status Enumeration
│   ├── IVehicleRepository.cs    # Repository Interface
│   └── Events/                  # Domain Events
│       └── VehicleDomainEvents.cs
├── FleetService.Application/     # Application Layer
│   ├── VehicleCommandService.cs # Command Service
│   ├── VehicleQueryService.cs   # Query Service
│   ├── VehicleSummaryDto.cs     # Data Transfer Object
│   └── Events/                  # Event Handling
│       ├── IDomainEventDispatcher.cs
│       └── VehicleDomainEventHandler.cs
├── FleetService.Infrastructure/  # Infrastructure Layer
│   ├── Repositories/            # Repository Implementations
│   │   ├── CosmosVehicleRepository.cs
│   │   ├── LazyCosmosVehicleRepository.cs
│   │   └── InMemoryVehicleRepository.cs
│   ├── Events/                  # Event Infrastructure
│   │   └── DomainEventDispatcher.cs
│   └── Services/                # External Service Integration
│       └── KeyVaultService.cs
└── FleetService.Api/            # API Layer
    ├── Controllers/             # Controllers
    │   └── VehiclesController.cs
    ├── Models/                  # API Models
    │   ├── UpdateVehicleStatusRequest.cs
    │   └── ApiError.cs
    ├── Authorization/           # Authorization Policies
    │   ├── PolicyNames.cs
    │   └── Roles.cs
    └── Extensions/              # Dependency Injection Extensions
        ├── DomainServiceExtensions.cs
        ├── ApiServiceExtensions.cs
        └── InfrastructureServiceExtensions.cs
```

### Domain Layer

#### 🎯 Vehicle Aggregate Root

```csharp
public sealed class Vehicle : Entity<string>, IAggregateRoot
{
    private Location _location;
    private VehicleStatus _status;

    // Factory Method Pattern
    public static Result<Vehicle> Create(string id, Location location, VehicleStatus status)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Result<Vehicle>.Failure(new Error("Vehicle.InvalidId", "Vehicle id must be non-empty."));

        return Result<Vehicle>.Success(new Vehicle(id.Trim(), location, status));
    }

    // Business Methods
    public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
    {
        // Business Rule: Cannot set to unknown status
        if (newStatus == VehicleStatus.Unknown)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.InvalidStatus", "Unsupported vehicle status."));

        if (_status == newStatus)
            return Result<VehicleStatus>.Success(_status);

        _status = newStatus;

        // Domain Event Publishing
        RaiseDomainEvent(new VehicleStatusChangedDomainEvent(Id, newStatus));

        return Result<VehicleStatus>.Success(_status);
    }
}
```

**Design Patterns Applied:**
- ✅ **Aggregate Root Pattern**: Vehicle manages consistency within its boundary
- ✅ **Factory Method Pattern**: Static Create method ensures valid object creation
- ✅ **Domain Events Pattern**: Publishing domain events on state changes
- ✅ **Result Pattern**: Using Result<T> instead of exceptions for business logic errors

#### 🎯 Location Value Object

```csharp
public sealed class Location : ValueObject
{
    public double Latitude { get; }
    public double Longitude { get; }

    private Location(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public static Result<Location> Create(double latitude, double longitude)
    {
        // Business rule validation
        if (latitude < -90 || latitude > 90)
            return Result<Location>.Failure(new Error("Location.InvalidLatitude", "Latitude must be between -90 and 90."));

        if (longitude < -180 || longitude > 180)
            return Result<Location>.Failure(new Error("Location.InvalidLongitude", "Longitude must be between -180 and 180."));

        return Result<Location>.Success(new Location(latitude, longitude));
    }

    // Value object equality comparison
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
    }
}
```

**Design Patterns Applied:**
- ✅ **Value Object Pattern**: Immutable value object with value-based equality
- ✅ **Validation Pattern**: Business rule validation during creation
- ✅ **Immutability Pattern**: Cannot be modified once created

### Application Layer

#### 🎯 Command Service

```csharp
public sealed class VehicleCommandService : IVehicleCommandService
{
    private readonly IVehicleRepository _repository;

    public VehicleCommandService(IVehicleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<VehicleStatus>> UpdateVehicleStatusAsync(
        string vehicleId,
        VehicleStatus expectedStatus,
        VehicleStatus newStatus,
        CancellationToken cancellationToken)
    {
        // 1. Get aggregate
        var vehicle = await _repository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.NotFound", $"Vehicle with id '{vehicleId}' not found."));

        // 2. Optimistic concurrency control
        if (vehicle.Status != expectedStatus)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.ConcurrencyConflict", "Vehicle status has been modified by another user."));

        // 3. Execute business logic
        var updateResult = vehicle.UpdateStatus(newStatus);
        if (updateResult.IsFailure)
            return updateResult;

        // 4. Persist (including domain event dispatch)
        await _repository.SaveAsync(vehicle, cancellationToken);

        return updateResult;
    }
}
```

**Design Patterns Applied:**
- ✅ **Command Pattern**: Encapsulating state modification operations
- ✅ **Unit of Work Pattern**: Repository saves aggregate and events together
- ✅ **Optimistic Concurrency Pattern**: Using expected status for concurrency control

#### 🎯 Query Service

```csharp
public sealed class VehicleQueryService : IVehicleQueryService
{
    private readonly IVehicleRepository _repository;

    public async Task<IReadOnlyList<VehicleSummaryDto>> GetNearbyVehiclesAsync(
        NearbyVehiclesQuery query,
        CancellationToken cancellationToken)
    {
        // 1. Create location value object
        var locationResult = Location.Create(query.Latitude, query.Longitude);
        if (locationResult.IsFailure)
            return new List<VehicleSummaryDto>();

        // 2. Query nearby vehicles
        var vehicles = await _repository.GetNearbyAsync(
            locationResult.Value!,
            query.RadiusKilometers,
            cancellationToken);

        // 3. Convert to DTOs
        return vehicles.Select(v => new VehicleSummaryDto
        {
            Id = v.Id,
            Latitude = v.Location.Latitude,
            Longitude = v.Location.Longitude,
            Status = v.Status.ToString()
        }).ToList();
    }
}
```

### Infrastructure Layer

#### 🎯 Repository Pattern Implementation

```csharp
// Cosmos DB Repository Implementation
public sealed class CosmosVehicleRepository : IVehicleRepository
{
    private readonly CosmosClient _client;
    private readonly IDomainEventDispatcher _dispatcher;

    public async Task<IReadOnlyList<Vehicle>> GetNearbyAsync(
        Location center,
        double radiusKilometers,
        CancellationToken cancellationToken)
    {
        // Using Cosmos DB geospatial queries
        var sql = @"SELECT * FROM c WHERE
                    ST_DISTANCE(c.location,
                        {'type':'Point','coordinates':[@lon,@lat]}
                    ) <= @maxMeters";

        var queryDefinition = new QueryDefinition(sql)
            .WithParameter("@lon", center.Longitude)
            .WithParameter("@lat", center.Latitude)
            .WithParameter("@maxMeters", radiusKilometers * 1000);

        // Execute query and convert to domain objects
        var iterator = Container.GetItemQueryIterator<VehicleDocument>(queryDefinition);
        var vehicles = new List<Vehicle>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            foreach (var doc in response)
            {
                var vehicle = ConvertToVehicle(doc);
                if (vehicle.IsSuccess)
                    vehicles.Add(vehicle.Value!);
            }
        }

        return vehicles;
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        // 1. Convert to document format
        var document = ConvertToDocument(vehicle);

        // 2. Save to Cosmos DB
        await Container.UpsertItemAsync(document, new PartitionKey(document.Id), cancellationToken: cancellationToken);

        // 3. Dispatch domain events
        var domainEvents = vehicle.DomainEvents.ToList();
        if (domainEvents.Any())
        {
            await _dispatcher.DispatchAsync(domainEvents, cancellationToken);
            vehicle.ClearDomainEvents();
        }
    }
}
```

#### 🎯 Lazy Loading Proxy Pattern

```csharp
// Lazy-initialized Cosmos Repository Proxy
public sealed class LazyCosmosVehicleRepository : IVehicleRepository
{
    private readonly Lazy<Task<CosmosVehicleRepository>> _lazyRepository;

    public LazyCosmosVehicleRepository(
        IKeyVaultService keyVaultService,
        IDomainEventDispatcher dispatcher,
        ILogger<CosmosVehicleRepository> logger)
    {
        _lazyRepository = new Lazy<Task<CosmosVehicleRepository>>(
            () => InitializeRepositoryAsync(keyVaultService, dispatcher, logger));
    }

    private async Task<CosmosVehicleRepository> InitializeRepositoryAsync(
        IKeyVaultService keyVaultService,
        IDomainEventDispatcher dispatcher,
        ILogger<CosmosVehicleRepository> logger)
    {
        // Get connection info from Key Vault
        var endpoint = await keyVaultService.GetSecretAsync("cosmos-endpoint");
        var key = await keyVaultService.GetSecretAsync("cosmos-key");

        // Create Cosmos client
        var cosmosClient = new CosmosClient(endpoint, key);

        // Return actual repository implementation
        return new CosmosVehicleRepository(cosmosClient, options, dispatcher, logger);
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        var repository = await _lazyRepository.Value;
        await repository.SaveAsync(vehicle, cancellationToken);
    }
}
```

**Design Patterns Applied:**
- ✅ **Repository Pattern**: Encapsulating data access logic
- ✅ **Proxy Pattern**: LazyCosmosVehicleRepository as proxy
- ✅ **Lazy Loading Pattern**: Delaying database connection initialization
- ✅ **Adapter Pattern**: Converting Cosmos DB documents to domain objects

### API Layer (Presentation Layer)

#### 🎯 Controller Design

```csharp
[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleQueryService _queryService;
    private readonly IVehicleCommandService _commandService;

    // Anonymous access - find nearby vehicles
    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehicles(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radius = 5.0,
        CancellationToken cancellationToken = default)
    {
        var query = new NearbyVehiclesQuery
        {
            Latitude = latitude,
            Longitude = longitude,
            RadiusKilometers = radius
        };

        var vehicles = await _queryService.GetNearbyVehiclesAsync(query, cancellationToken);
        return Ok(vehicles);
    }

    // Role-based authorization - update vehicle status
    [HttpPut("{id}/status")]
    [Authorize(Policy = PolicyNames.TechnicianOnly)]
    public async Task<ActionResult<ApiSuccess<VehicleStatusDto>>> UpdateVehicleStatus(
        string id,
        [FromBody] UpdateVehicleStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        // Business rule validation
        var validationResult = await _statusValidator.ValidateStatusTransitionAsync(
            User, request.ExpectedStatus, request.NewStatus);

        if (validationResult.IsFailure)
            return BadRequest(new ApiError(validationResult.Error));

        // Execute command
        var result = await _commandService.UpdateVehicleStatusAsync(
            id, request.ExpectedStatus, request.NewStatus, cancellationToken);

        if (result.IsFailure)
        {
            return result.Error.Code switch
            {
                "Vehicle.NotFound" => NotFound(new ApiError(result.Error)),
                "Vehicle.ConcurrencyConflict" => Conflict(new ConcurrencyConflictError(result.Error)),
                _ => BadRequest(new ApiError(result.Error))
            };
        }

        return Ok(new ApiSuccess<VehicleStatusDto>(new VehicleStatusDto { Status = result.Value }));
    }
}
```

#### 🎯 Authorization Policy Configuration

```csharp
public static class ApiServiceExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        // JWT Authentication configuration
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(services.BuildServiceProvider()
                .GetRequiredService<IConfiguration>().GetSection("AzureAd"));

        // Authorization policies
        services.AddAuthorization(options =>
        {
            // Technician-only policy
            options.AddPolicy(PolicyNames.TechnicianOnly, policy =>
                policy.RequireRole(Roles.Technician));

            // Authenticated user policy
            options.AddPolicy(PolicyNames.AuthenticatedUser, policy =>
                policy.RequireRole(Roles.User, Roles.Technician));
        });

        return services;
    }
}
```

**Best Practices Applied:**
- ✅ **Single Responsibility**: Each controller method has a single responsibility
- ✅ **Dependency Injection**: Constructor injection for dependencies
- ✅ **Policy-based Authorization**: Policy-based authorization instead of hardcoded roles
- ✅ **HTTP Status Codes**: Proper HTTP status code usage
- ✅ **Error Handling**: Consistent error handling and response formatting

---

## 🎨 Vehicle-Rental-Web Frontend Architecture Details

### Project Structure

```
src/
├── components/                  # UI Components
│   ├── VehicleList.tsx         # Vehicle List Component
│   ├── VehicleActions.tsx      # Vehicle Actions Component
│   ├── UserVehiclesView.tsx    # User Vehicles View
│   └── MapView.tsx             # Map View Component
├── auth/                       # Authentication Module
│   ├── AuthContext.tsx         # Authentication Context
│   ├── AuthProvider.tsx        # Authentication Provider
│   ├── types.ts                # Authentication Type Definitions
│   ├── roleUtils.ts            # Role Utility Functions
│   └── components/             # Authentication Components
│       ├── LoginButton.tsx
│       └── LogoutButton.tsx
├── services/                   # Service Layer
│   ├── httpClient.ts           # HTTP Client
│   ├── vehicleService.ts       # Vehicle Service
│   └── authService.ts          # Authentication Service
├── hooks/                      # Custom Hooks
│   ├── useAuth.ts              # Authentication Hook
│   ├── useVehicles.ts          # Vehicle Data Hook
│   └── useGeolocation.ts       # Geolocation Hook
├── types/                      # Type Definitions
│   ├── vehicle.ts              # Vehicle Types
│   ├── user.ts                 # User Types
│   └── api.ts                  # API Types
├── config/                     # Configuration Files
│   └── msalConfig.ts           # MSAL Configuration
└── App.tsx                     # Main Application Component
```

### Authentication Architecture Design

#### 🎯 MSAL Integration

```typescript
// MSAL Configuration
export const msalConfig: Configuration = {
    auth: {
        clientId: "59f2f452-fcb5-4297-b702-f06230f75c63",
        authority: "https://login.microsoftonline.com/282eb06d-3a65-48c3-81c3-225d1e9a10f8",
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: false,
    },
};

// Login request configuration
export const loginRequest: RedirectRequest = {
    scopes: ["api://59f2f452-fcb5-4297-b702-f06230f75c63/access_as_user"],
    prompt: PromptValue.SELECT_ACCOUNT,
};
```

#### 🎯 Authentication Context (Context Pattern)

```typescript
interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { instance, accounts } = useMsal();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (accounts.length > 0) {
                    const account = accounts[0];
                    const authUser = convertMsalAccountToAuthUser(account);
                    setUser(authUser);
                }
            } catch (err) {
                setError('Failed to initialize authentication');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [accounts]);

    const login = async () => {
        try {
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            setError('Login failed');
        }
    };

    const getAccessToken = async (): Promise<string | null> => {
        if (accounts.length === 0) return null;

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });
            return response.accessToken;
        } catch (error) {
            // Silent acquisition failed, try redirect
            await instance.acquireTokenRedirect(loginRequest);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!user,
            user,
            login,
            logout,
            getAccessToken,
            loading,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
};
```

#### 🎯 Role-based Permission System

```typescript
// Role checking utilities
export const isAuthenticated = (user: AuthUser | null): boolean => {
    return user !== null;
};

export const isTechnician = (user: AuthUser | null): boolean => {
    if (!user) return false;
    return user.roles?.includes('Technician') || user.role === 'Technician';
};

export const isUser = (user: AuthUser | null): boolean => {
    if (!user) return false;
    return user.roles?.includes('User') || user.role === 'User';
};

// Permission system
export interface UserPermissions {
    canViewNearbyVehicles: boolean;
    canRentVehicles: boolean;
    canReturnVehicles: boolean;
    canViewOwnVehicles: boolean;
    canUpdateVehicleStatus: boolean;
    canSetMaintenanceStatus: boolean;
    canSetOutOfServiceStatus: boolean;
}

export const getUserPermissions = (user: AuthUser | null): UserPermissions => {
    const userIsTechnician = isTechnician(user);
    const userIsAuthenticated = isAuthenticated(user);

    return {
        canViewNearbyVehicles: true, // Anonymous access allowed
        canRentVehicles: userIsAuthenticated,
        canReturnVehicles: userIsAuthenticated,
        canViewOwnVehicles: userIsAuthenticated,
        canUpdateVehicleStatus: userIsTechnician,
        canSetMaintenanceStatus: userIsTechnician,
        canSetOutOfServiceStatus: userIsTechnician,
    };
};
```

### Service Layer Design

#### 🎯 HTTP Client Encapsulation

```typescript
// Authenticated HTTP Client
const createAuthenticatedClient = () => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
    });

    // Request interceptor - Add JWT Token
    client.interceptors.request.use(async (config) => {
        const { instance, accounts } = useMsal();

        if (accounts.length > 0) {
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0],
                });

                config.headers.Authorization = `Bearer ${response.accessToken}`;
            } catch (error) {
                console.error('Token acquisition failed:', error);
            }
        }

        return config;
    });

    // Response interceptor - Error handling
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token expired, redirect to login
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    return client;
};

// Anonymous HTTP Client
const unauthenticatedClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});
```

#### 🎯 Vehicle Service Encapsulation

```typescript
export const vehicleService = {
    // Anonymous access - get nearby vehicles
    async getNearbyVehicles(
        latitude: number,
        longitude: number,
        radius: number = 5
    ): Promise<VehicleSummaryDto[]> {
        const params = { latitude, longitude, radius };
        return await anonymousHttpClient.get<VehicleSummaryDto[]>('/vehicles/nearby', { params });
    },

    // Authenticated access - get user vehicles
    async getUserVehicles(): Promise<VehicleSummaryDto[]> {
        return await authenticatedHttpClient.get<VehicleSummaryDto[]>('/vehicles/user');
    },

    // Authenticated access - update vehicle status
    async updateVehicleStatus(
        vehicleId: string,
        expectedStatus: VehicleStatus,
        newStatus: VehicleStatus
    ): Promise<ApiSuccess<VehicleStatusDto>> {
        const request: UpdateVehicleStatusRequest = {
            expectedStatus,
            newStatus
        };

        return await authenticatedHttpClient.put<ApiSuccess<VehicleStatusDto>>(
            `/vehicles/${vehicleId}/status`,
            request
        );
    },

    // Authenticated access - rent vehicle
    async rentVehicle(vehicleId: string): Promise<ApiSuccess<VehicleStatusDto>> {
        return await authenticatedHttpClient.post<ApiSuccess<VehicleStatusDto>>(
            `/vehicles/${vehicleId}/rent`
        );
    },

    // Authenticated access - return vehicle
    async returnVehicle(vehicleId: string): Promise<ApiSuccess<VehicleStatusDto>> {
        return await authenticatedHttpClient.post<ApiSuccess<VehicleStatusDto>>(
            `/vehicles/${vehicleId}/return`
        );
    }
};
```

### Component Design Patterns

#### 🎯 Role-based UI Components

```typescript
export const VehicleActions: React.FC<VehicleActionsProps> = ({ vehicle, onRefresh }) => {
    const { user } = useAuth();
    const permissions = getUserPermissions(user);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRent = async () => {
        if (!permissions.canRentVehicles) return;

        setIsLoading(true);
        setError(null);

        try {
            await vehicleService.rentVehicle(vehicle.id);
            onRefresh();
        } catch (err) {
            setError('Failed to rent vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: VehicleStatus) => {
        if (!permissions.canUpdateVehicleStatus) return;

        setIsLoading(true);
        setError(null);

        try {
            await vehicleService.updateVehicleStatus(
                vehicle.id,
                vehicle.status,
                newStatus
            );
            onRefresh();
        } catch (err) {
            setError('Failed to update vehicle status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="vehicle-actions">
            {error && <div className="error-message">{error}</div>}

            {/* User actions */}
            {permissions.canRentVehicles && vehicle.status === 'Available' && (
                <button
                    onClick={handleRent}
                    disabled={isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Renting...' : 'Rent Vehicle'}
                </button>
            )}

            {/* Technician actions */}
            {permissions.canUpdateVehicleStatus && (
                <div className="technician-actions">
                    <button
                        onClick={() => handleStatusUpdate('Maintenance')}
                        disabled={isLoading}
                        className="btn btn-warning"
                    >
                        Set Maintenance
                    </button>

                    <button
                        onClick={() => handleStatusUpdate('OutOfService')}
                        disabled={isLoading}
                        className="btn btn-danger"
                    >
                        Set Out of Service
                    </button>
                </div>
            )}
        </div>
    );
};
```

#### 🎯 Custom Hooks

```typescript
// Vehicle data management hook
export const useVehicles = () => {
    const [vehicles, setVehicles] = useState<VehicleSummaryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNearbyVehicles = useCallback(async (
        latitude: number,
        longitude: number,
        radius: number = 5
    ) => {
        setLoading(true);
        setError(null);

        try {
            const data = await vehicleService.getNearbyVehicles(latitude, longitude, radius);
            setVehicles(data);
        } catch (err) {
            setError('Failed to fetch nearby vehicles');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUserVehicles = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await vehicleService.getUserVehicles();
            setVehicles(data);
        } catch (err) {
            setError('Failed to fetch user vehicles');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        vehicles,
        loading,
        error,
        fetchNearbyVehicles,
        fetchUserVehicles,
        refresh: () => {
            // Re-fetch current data
            if (vehicles.length > 0) {
                // Determine refresh strategy based on context
            }
        }
    };
};

// Geolocation hook
export const useGeolocation = () => {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getCurrentLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setLoading(false);
            },
            (err) => {
                setError('Failed to get current location');
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5-minute cache
            }
        );
    }, []);

    return { location, error, loading, getCurrentLocation };
};
```

---

## 🏆 Best Practices Implementation Details

### 1. SOLID Principles Implementation

#### ✅ Single Responsibility Principle (SRP)
- **Vehicle**: Only responsible for vehicle business logic
- **VehicleRepository**: Only responsible for data access
- **VehicleCommandService**: Only responsible for command operations
- **VehicleQueryService**: Only responsible for query operations

#### ✅ Open/Closed Principle (OCP)
- **IVehicleRepository**: Interface open for extension, closed for modification
- **DomainEventHandler**: Can add new event handlers without modifying existing code

#### ✅ Liskov Substitution Principle (LSP)
- **InMemoryVehicleRepository** and **CosmosVehicleRepository** can be completely substituted
- **LazyCosmosVehicleRepository** proxy is fully compatible with the interface

#### ✅ Interface Segregation Principle (ISP)
- **IVehicleCommandService** and **IVehicleQueryService** are separated
- **IDomainEventHandler<T>** is segregated by event type

#### ✅ Dependency Inversion Principle (DIP)
- All layers depend on interfaces, not concrete implementations
- Dependencies injected through DI container

### 2. Security Best Practices

#### 🔐 Authentication & Authorization
```csharp
// Policy-based authorization
[Authorize(Policy = PolicyNames.TechnicianOnly)]
public async Task<ActionResult> UpdateVehicleStatus(...)

// JWT Token validation
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"));
```

#### 🔐 Data Protection
```csharp
// Parameter validation
public static Result<Location> Create(double latitude, double longitude)
{
    if (latitude < -90 || latitude > 90)
        return Result<Location>.Failure(new Error("Location.InvalidLatitude", "..."));
}

// SQL injection protection (using parameterized queries)
var queryDefinition = new QueryDefinition(sql)
    .WithParameter("@lon", center.Longitude)
    .WithParameter("@lat", center.Latitude);
```

#### 🔐 Secret Management
```csharp
// Azure Key Vault integration
var endpoint = await _keyVaultService.GetSecretAsync("cosmos-endpoint");
var key = await _keyVaultService.GetSecretAsync("cosmos-key");
```

### 3. Performance Optimization Strategies

#### ⚡ Database Optimization
```javascript
// Cosmos DB geospatial indexing
{
  "spatialIndexes": [
    {
      "path": "/location/*",
      "types": ["Point"]
    }
  ]
}
```

#### ⚡ Frontend Optimization
```typescript
// React.memo to prevent unnecessary renders
export const VehicleItem = React.memo<VehicleItemProps>(({ vehicle }) => {
    return <div>{vehicle.name}</div>;
});

// useCallback to cache functions
const handleRefresh = useCallback(() => {
    fetchNearbyVehicles(location.latitude, location.longitude);
}, [location, fetchNearbyVehicles]);
```

#### ⚡ Lazy Loading
```csharp
// Lazy initialization of database connections
private readonly Lazy<Task<CosmosVehicleRepository>> _lazyRepository;
```

### 4. Error Handling Strategy

#### ⭐ Result Pattern
```csharp
// Business logic errors don't use exceptions
public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
{
    if (newStatus == VehicleStatus.Unknown)
        return Result<VehicleStatus>.Failure(new Error("Vehicle.InvalidStatus", "..."));

    return Result<VehicleStatus>.Success(newStatus);
}
```

#### ⭐ Frontend Error Boundaries
```typescript
// Error state management
const [error, setError] = useState<string | null>(null);

try {
    await vehicleService.rentVehicle(vehicleId);
} catch (err) {
    setError('Failed to rent vehicle');
}
```

### 5. Testing Strategy

#### 🧪 Unit Testing
```csharp
[Fact]
public async Task UpdateVehicleStatusAsync_ShouldSucceed_WhenValidParameters()
{
    // Arrange
    var repository = new InMemoryVehicleRepository(new NoOpDispatcher());
    var service = new VehicleCommandService(repository);

    // Act
    var result = await service.UpdateVehicleStatusAsync("VIN123", VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

    // Assert
    Assert.True(result.IsSuccess);
}
```

#### 🧪 Integration Testing
```csharp
[Test]
public async Task GetNearbyVehicles_ShouldReturnVehiclesWithinRadius()
{
    // Using TestServer for end-to-end testing
    var response = await _client.GetAsync("/api/vehicles/nearby?latitude=47.6062&longitude=-122.3321&radius=5");

    response.EnsureSuccessStatusCode();
    var vehicles = await response.Content.ReadFromJsonAsync<List<VehicleSummaryDto>>();

    Assert.NotNull(vehicles);
}
```

---

## 📊 Architecture Diagrams Summary

### Data Flow Diagram

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐    SQL Query     ┌─────────────────┐
│   React SPA     │ ───────────────> │  FleetService   │ ──────────────> │  Cosmos DB      │
│                 │                  │   API           │                 │                 │
│ - Components    │ <─────────────── │                 │ <────────────── │ - GeoJSON       │
│ - Auth Context  │   JSON Response  │ - Controllers   │   Query Result  │ - Spatial Index │
│ - HTTP Client   │                  │ - Services      │                 │ - Document      │
└─────────────────┘                  │ - Repositories  │                 └─────────────────┘
         ^                           └─────────────────┘                          ^
         |                                     ^                                  |
         |                                     |                                  |
         v                                     v                                  |
┌─────────────────┐                  ┌─────────────────┐                         |
│ Azure Entra ID  │                  │ Domain Events   │                         |
│                 │                  │                 │                         |
│ - JWT Tokens    │                  │ - Event Bus     │ ────────────────────────┘
│ - User Roles    │                  │ - Handlers      │      Domain Events
│ - Policies      │                  │ - Dispatcher    │      (Future: Event Hubs)
└─────────────────┘                  └─────────────────┘
```

### Dependency Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │   Extensions    │  │ Authorization│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ Depends on
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Command Service │  │  Query Service  │  │ Event Handler│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ Depends on
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Entities     │  │  Value Objects  │  │Domain Events │ │
│  │   (Vehicle)     │  │   (Location)    │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              ▲ Implements
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Repositories   │  │  Event Dispatch │  │External APIs │ │
│  │   (Cosmos DB)   │  │                 │  │(Key Vault)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 Summary and Learning Points

### Core Design Philosophy

1. **Separation of Concerns**: Different layers handle different responsibilities
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Open/Closed**: Open for extension, closed for modification
4. **Single Responsibility**: Each class has only one reason to change
5. **Interface Segregation**: Clients shouldn't depend on interfaces they don't need

### Technology Selection Principles

1. **Type Safety**: C# and TypeScript provide compile-time checking
2. **Cloud Native**: Leverage Azure service capabilities fully
3. **Scalability**: Microservice architecture supports independent scaling
4. **Security**: Enterprise-level identity management and authorization
5. **Performance**: Geospatial queries and caching optimization

### Future Extension Directions

1. **Event-Driven Architecture**: Integration with Azure Event Hubs
2. **CQRS + Event Sourcing**: Complete event sourcing implementation
3. **Micro-frontend**: Modular frontend architecture
4. **API Gateway**: Unified API management
5. **Monitoring & Logging**: Application Insights integration

---

**Document Version**: v1.0
**Creation Date**: 2024-10-26
**Applicable Versions**: .NET 8.0, React 19.2.0
**Maintenance Team**: Vehicle Rental Development Team