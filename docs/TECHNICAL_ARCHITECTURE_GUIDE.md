# Vehicle Rental System - 技术架构设计文档

## 📖 文档目标

本文档详细讲解 Vehicle Rental System 的技术架构设计，包括 FleetService 后端微服务和 Vehicle-Rental-Web 前端应用的设计模式、最佳实践和实现细节。适合技术团队学习和项目交接使用。

---

## 🏗️ 整体架构概览

### 系统架构图

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

### 核心技术栈

| 组件 | 技术选择 | 版本 | 用途 |
|------|----------|------|------|
| **后端框架** | ASP.NET Core | 8.0 | Web API 和微服务 |
| **前端框架** | React | 19.2.0 | 单页应用 (SPA) |
| **编程语言** | C# / TypeScript | Latest | 类型安全的开发 |
| **数据库** | Azure Cosmos DB | - | NoSQL 文档数据库 |
| **身份认证** | Azure Entra ID | - | 企业级身份管理 |
| **容器化** | Docker | - | 应用打包和部署 |
| **云平台** | Azure Container Apps | - | Serverless 容器托管 |

---

## 🎯 设计原则与模式

### 1. Clean Architecture (整洁架构)

采用 Uncle Bob 的 Clean Architecture 分层模式：

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

**优势：**
- ✅ **依赖倒置**：内层不依赖外层
- ✅ **业务逻辑隔离**：核心业务不受技术细节影响
- ✅ **可测试性**：每层都可以独立测试
- ✅ **可维护性**：结构清晰，职责分明

### 2. Domain-Driven Design (DDD)

实现 DDD 的核心概念：

```csharp
// 聚合根 (Aggregate Root)
public sealed class Vehicle : Entity<string>, IAggregateRoot
{
    // 值对象 (Value Object)
    private Location _location;
    private VehicleStatus _status;

    // 领域方法 (Domain Methods)
    public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
    {
        // 业务规则验证
        if (!IsValidStatusTransition(newStatus))
            return Result<VehicleStatus>.Failure(new Error("Invalid transition"));

        _status = newStatus;

        // 领域事件 (Domain Event)
        RaiseDomainEvent(new VehicleStatusChangedDomainEvent(Id, newStatus));

        return Result<VehicleStatus>.Success(_status);
    }
}
```

### 3. CQRS (命令查询职责分离)

分离读写操作以优化性能：

```csharp
// 命令服务 (Command Service) - 写操作
public interface IVehicleCommandService
{
    Task<Result<VehicleStatus>> UpdateVehicleStatusAsync(
        string vehicleId,
        VehicleStatus expectedStatus,
        VehicleStatus newStatus,
        CancellationToken cancellationToken);
}

// 查询服务 (Query Service) - 读操作
public interface IVehicleQueryService
{
    Task<IReadOnlyList<VehicleSummaryDto>> GetNearbyVehiclesAsync(
        NearbyVehiclesQuery query,
        CancellationToken cancellationToken);
}
```

---

## 🔧 FleetService 后端架构详解

### 项目结构

```
FleetService/
├── FleetService.Domain/          # 领域层
│   ├── Vehicle.cs               # 车辆聚合根
│   ├── Location.cs              # 位置值对象
│   ├── VehicleStatus.cs         # 车辆状态枚举
│   ├── IVehicleRepository.cs    # 仓储接口
│   └── Events/                  # 领域事件
│       └── VehicleDomainEvents.cs
├── FleetService.Application/     # 应用层
│   ├── VehicleCommandService.cs # 命令服务
│   ├── VehicleQueryService.cs   # 查询服务
│   ├── VehicleSummaryDto.cs     # 数据传输对象
│   └── Events/                  # 事件处理
│       ├── IDomainEventDispatcher.cs
│       └── VehicleDomainEventHandler.cs
├── FleetService.Infrastructure/  # 基础设施层
│   ├── Repositories/            # 仓储实现
│   │   ├── CosmosVehicleRepository.cs
│   │   ├── LazyCosmosVehicleRepository.cs
│   │   └── InMemoryVehicleRepository.cs
│   ├── Events/                  # 事件基础设施
│   │   └── DomainEventDispatcher.cs
│   └── Services/                # 外部服务集成
│       └── KeyVaultService.cs
└── FleetService.Api/            # API层
    ├── Controllers/             # 控制器
    │   └── VehiclesController.cs
    ├── Models/                  # API模型
    │   ├── UpdateVehicleStatusRequest.cs
    │   └── ApiError.cs
    ├── Authorization/           # 授权策略
    │   ├── PolicyNames.cs
    │   └── Roles.cs
    └── Extensions/              # 依赖注入扩展
        ├── DomainServiceExtensions.cs
        ├── ApiServiceExtensions.cs
        └── InfrastructureServiceExtensions.cs
```

### 领域层 (Domain Layer)

#### 🎯 Vehicle 聚合根

```csharp
public sealed class Vehicle : Entity<string>, IAggregateRoot
{
    private Location _location;
    private VehicleStatus _status;

    // 工厂方法 (Factory Method)
    public static Result<Vehicle> Create(string id, Location location, VehicleStatus status)
    {
        if (string.IsNullOrWhiteSpace(id))
            return Result<Vehicle>.Failure(new Error("Vehicle.InvalidId", "Vehicle id must be non-empty."));

        return Result<Vehicle>.Success(new Vehicle(id.Trim(), location, status));
    }

    // 业务方法
    public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
    {
        // 业务规则：不能设置为未知状态
        if (newStatus == VehicleStatus.Unknown)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.InvalidStatus", "Unsupported vehicle status."));

        if (_status == newStatus)
            return Result<VehicleStatus>.Success(_status);

        _status = newStatus;

        // 领域事件发布
        RaiseDomainEvent(new VehicleStatusChangedDomainEvent(Id, newStatus));

        return Result<VehicleStatus>.Success(_status);
    }
}
```

**设计模式应用：**
- ✅ **Aggregate Root Pattern**: Vehicle 作为聚合根管理边界内的一致性
- ✅ **Factory Method Pattern**: 使用静态 Create 方法确保对象创建的有效性
- ✅ **Domain Events Pattern**: 状态变更时发布领域事件
- ✅ **Result Pattern**: 使用 Result<T> 替代异常处理业务逻辑错误

#### 🎯 Location 值对象

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
        // 业务规则验证
        if (latitude < -90 || latitude > 90)
            return Result<Location>.Failure(new Error("Location.InvalidLatitude", "Latitude must be between -90 and 90."));

        if (longitude < -180 || longitude > 180)
            return Result<Location>.Failure(new Error("Location.InvalidLongitude", "Longitude must be between -180 and 180."));

        return Result<Location>.Success(new Location(latitude, longitude));
    }

    // 值对象相等性比较
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
    }
}
```

**设计模式应用：**
- ✅ **Value Object Pattern**: 不可变的值对象，基于值进行相等性比较
- ✅ **Validation Pattern**: 创建时验证业务规则
- ✅ **Immutability Pattern**: 一旦创建不可修改

### 应用层 (Application Layer)

#### 🎯 命令服务 (Command Service)

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
        // 1. 获取聚合
        var vehicle = await _repository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.NotFound", $"Vehicle with id '{vehicleId}' not found."));

        // 2. 乐观并发控制
        if (vehicle.Status != expectedStatus)
            return Result<VehicleStatus>.Failure(new Error("Vehicle.ConcurrencyConflict", "Vehicle status has been modified by another user."));

        // 3. 执行业务逻辑
        var updateResult = vehicle.UpdateStatus(newStatus);
        if (updateResult.IsFailure)
            return updateResult;

        // 4. 持久化 (包含领域事件分发)
        await _repository.SaveAsync(vehicle, cancellationToken);

        return updateResult;
    }
}
```

**设计模式应用：**
- ✅ **Command Pattern**: 封装状态修改操作
- ✅ **Unit of Work Pattern**: Repository 保存时统一处理聚合和事件
- ✅ **Optimistic Concurrency Pattern**: 使用期望状态进行并发控制

#### 🎯 查询服务 (Query Service)

```csharp
public sealed class VehicleQueryService : IVehicleQueryService
{
    private readonly IVehicleRepository _repository;

    public async Task<IReadOnlyList<VehicleSummaryDto>> GetNearbyVehiclesAsync(
        NearbyVehiclesQuery query,
        CancellationToken cancellationToken)
    {
        // 1. 创建位置值对象
        var locationResult = Location.Create(query.Latitude, query.Longitude);
        if (locationResult.IsFailure)
            return new List<VehicleSummaryDto>();

        // 2. 查询附近车辆
        var vehicles = await _repository.GetNearbyAsync(
            locationResult.Value!,
            query.RadiusKilometers,
            cancellationToken);

        // 3. 转换为 DTO
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

### 基础设施层 (Infrastructure Layer)

#### 🎯 仓储模式实现

```csharp
// Cosmos DB 仓储实现
public sealed class CosmosVehicleRepository : IVehicleRepository
{
    private readonly CosmosClient _client;
    private readonly IDomainEventDispatcher _dispatcher;

    public async Task<IReadOnlyList<Vehicle>> GetNearbyAsync(
        Location center,
        double radiusKilometers,
        CancellationToken cancellationToken)
    {
        // 使用 Cosmos DB 的地理空间查询
        var sql = @"SELECT * FROM c WHERE
                    ST_DISTANCE(c.location,
                        {'type':'Point','coordinates':[@lon,@lat]}
                    ) <= @maxMeters";

        var queryDefinition = new QueryDefinition(sql)
            .WithParameter("@lon", center.Longitude)
            .WithParameter("@lat", center.Latitude)
            .WithParameter("@maxMeters", radiusKilometers * 1000);

        // 执行查询并转换为领域对象
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
        // 1. 转换为文档格式
        var document = ConvertToDocument(vehicle);

        // 2. 保存到 Cosmos DB
        await Container.UpsertItemAsync(document, new PartitionKey(document.Id), cancellationToken: cancellationToken);

        // 3. 分发领域事件
        var domainEvents = vehicle.DomainEvents.ToList();
        if (domainEvents.Any())
        {
            await _dispatcher.DispatchAsync(domainEvents, cancellationToken);
            vehicle.ClearDomainEvents();
        }
    }
}
```

#### 🎯 延迟加载代理模式

```csharp
// 延迟初始化的 Cosmos 仓储代理
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
        // 从 Key Vault 获取连接信息
        var endpoint = await keyVaultService.GetSecretAsync("cosmos-endpoint");
        var key = await keyVaultService.GetSecretAsync("cosmos-key");

        // 创建 Cosmos 客户端
        var cosmosClient = new CosmosClient(endpoint, key);

        // 返回实际的仓储实现
        return new CosmosVehicleRepository(cosmosClient, options, dispatcher, logger);
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        var repository = await _lazyRepository.Value;
        await repository.SaveAsync(vehicle, cancellationToken);
    }
}
```

**设计模式应用：**
- ✅ **Repository Pattern**: 封装数据访问逻辑
- ✅ **Proxy Pattern**: LazyCosmosVehicleRepository 作为代理
- ✅ **Lazy Loading Pattern**: 延迟初始化数据库连接
- ✅ **Adapter Pattern**: 将 Cosmos DB 文档转换为领域对象

### API层 (Presentation Layer)

#### 🎯 控制器设计

```csharp
[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleQueryService _queryService;
    private readonly IVehicleCommandService _commandService;

    // 匿名访问 - 查找附近车辆
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

    // 基于角色的授权 - 更新车辆状态
    [HttpPut("{id}/status")]
    [Authorize(Policy = PolicyNames.TechnicianOnly)]
    public async Task<ActionResult<ApiSuccess<VehicleStatusDto>>> UpdateVehicleStatus(
        string id,
        [FromBody] UpdateVehicleStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        // 业务规则验证
        var validationResult = await _statusValidator.ValidateStatusTransitionAsync(
            User, request.ExpectedStatus, request.NewStatus);

        if (validationResult.IsFailure)
            return BadRequest(new ApiError(validationResult.Error));

        // 执行命令
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

#### 🎯 授权策略配置

```csharp
public static class ApiServiceExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        // JWT 认证配置
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(services.BuildServiceProvider()
                .GetRequiredService<IConfiguration>().GetSection("AzureAd"));

        // 授权策略
        services.AddAuthorization(options =>
        {
            // 技术员专用策略
            options.AddPolicy(PolicyNames.TechnicianOnly, policy =>
                policy.RequireRole(Roles.Technician));

            // 认证用户策略
            options.AddPolicy(PolicyNames.AuthenticatedUser, policy =>
                policy.RequireRole(Roles.User, Roles.Technician));
        });

        return services;
    }
}
```

**Best Practices 应用：**
- ✅ **Single Responsibility**: 每个控制器方法职责单一
- ✅ **Dependency Injection**: 构造函数注入依赖
- ✅ **Policy-based Authorization**: 基于策略的授权而非硬编码
- ✅ **HTTP Status Codes**: 正确的 HTTP 状态码使用
- ✅ **Error Handling**: 统一的错误处理和响应格式

---

## 🎨 Vehicle-Rental-Web 前端架构详解

### 项目结构

```
src/
├── components/                  # UI组件
│   ├── VehicleList.tsx         # 车辆列表组件
│   ├── VehicleActions.tsx      # 车辆操作组件
│   ├── UserVehiclesView.tsx    # 用户车辆视图
│   └── MapView.tsx             # 地图视图组件
├── auth/                       # 认证模块
│   ├── AuthContext.tsx         # 认证上下文
│   ├── AuthProvider.tsx        # 认证提供者
│   ├── types.ts                # 认证类型定义
│   ├── roleUtils.ts            # 角色工具函数
│   └── components/             # 认证组件
│       ├── LoginButton.tsx
│       └── LogoutButton.tsx
├── services/                   # 服务层
│   ├── httpClient.ts           # HTTP客户端
│   ├── vehicleService.ts       # 车辆服务
│   └── authService.ts          # 认证服务
├── hooks/                      # 自定义Hooks
│   ├── useAuth.ts              # 认证Hook
│   ├── useVehicles.ts          # 车辆数据Hook
│   └── useGeolocation.ts       # 地理位置Hook
├── types/                      # 类型定义
│   ├── vehicle.ts              # 车辆类型
│   ├── user.ts                 # 用户类型
│   └── api.ts                  # API类型
├── config/                     # 配置文件
│   └── msalConfig.ts           # MSAL配置
└── App.tsx                     # 主应用组件
```

### 认证架构设计

#### 🎯 MSAL 集成

```typescript
// MSAL 配置
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

// 登录请求配置
export const loginRequest: RedirectRequest = {
    scopes: ["api://59f2f452-fcb5-4297-b702-f06230f75c63/access_as_user"],
    prompt: PromptValue.SELECT_ACCOUNT,
};
```

#### 🎯 认证上下文 (Context Pattern)

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
            // 静默获取失败，尝试重定向
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

#### 🎯 角色基础权限系统

```typescript
// 角色检查工具
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

// 权限系统
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
        canViewNearbyVehicles: true, // 匿名可访问
        canRentVehicles: userIsAuthenticated,
        canReturnVehicles: userIsAuthenticated,
        canViewOwnVehicles: userIsAuthenticated,
        canUpdateVehicleStatus: userIsTechnician,
        canSetMaintenanceStatus: userIsTechnician,
        canSetOutOfServiceStatus: userIsTechnician,
    };
};
```

### 服务层设计

#### 🎯 HTTP 客户端封装

```typescript
// 认证 HTTP 客户端
const createAuthenticatedClient = () => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 10000,
    });

    // 请求拦截器 - 添加 JWT Token
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

    // 响应拦截器 - 错误处理
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token 过期，重定向到登录
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    return client;
};

// 匿名 HTTP 客户端
const unauthenticatedClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});
```

#### 🎯 车辆服务封装

```typescript
export const vehicleService = {
    // 匿名访问 - 获取附近车辆
    async getNearbyVehicles(
        latitude: number,
        longitude: number,
        radius: number = 5
    ): Promise<VehicleSummaryDto[]> {
        const params = { latitude, longitude, radius };
        return await anonymousHttpClient.get<VehicleSummaryDto[]>('/vehicles/nearby', { params });
    },

    // 认证访问 - 获取用户车辆
    async getUserVehicles(): Promise<VehicleSummaryDto[]> {
        return await authenticatedHttpClient.get<VehicleSummaryDto[]>('/vehicles/user');
    },

    // 认证访问 - 更新车辆状态
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

    // 认证访问 - 租车
    async rentVehicle(vehicleId: string): Promise<ApiSuccess<VehicleStatusDto>> {
        return await authenticatedHttpClient.post<ApiSuccess<VehicleStatusDto>>(
            `/vehicles/${vehicleId}/rent`
        );
    },

    // 认证访问 - 还车
    async returnVehicle(vehicleId: string): Promise<ApiSuccess<VehicleStatusDto>> {
        return await authenticatedHttpClient.post<ApiSuccess<VehicleStatusDto>>(
            `/vehicles/${vehicleId}/return`
        );
    }
};
```

### 组件设计模式

#### 🎯 基于角色的UI组件

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

            {/* 用户操作 */}
            {permissions.canRentVehicles && vehicle.status === 'Available' && (
                <button
                    onClick={handleRent}
                    disabled={isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Renting...' : 'Rent Vehicle'}
                </button>
            )}

            {/* 技术员操作 */}
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

#### 🎯 自定义 Hooks

```typescript
// 车辆数据管理 Hook
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
            // 重新获取当前数据
            if (vehicles.length > 0) {
                // 根据上下文决定刷新策略
            }
        }
    };
};

// 地理位置 Hook
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
                maximumAge: 300000 // 5分钟缓存
            }
        );
    }, []);

    return { location, error, loading, getCurrentLocation };
};
```

---

## 🏆 Best Practices 应用详解

### 1. SOLID 原则实现

#### ✅ Single Responsibility Principle (SRP)
- **Vehicle**: 只负责车辆业务逻辑
- **VehicleRepository**: 只负责数据访问
- **VehicleCommandService**: 只负责命令操作
- **VehicleQueryService**: 只负责查询操作

#### ✅ Open/Closed Principle (OCP)
- **IVehicleRepository**: 接口开放扩展，关闭修改
- **DomainEventHandler**: 可以添加新的事件处理器而不修改现有代码

#### ✅ Liskov Substitution Principle (LSP)
- **InMemoryVehicleRepository** 和 **CosmosVehicleRepository** 可以完全替换
- **LazyCosmosVehicleRepository** 代理完全兼容接口

#### ✅ Interface Segregation Principle (ISP)
- **IVehicleCommandService** 和 **IVehicleQueryService** 分离
- **IDomainEventHandler<T>** 按事件类型分离

#### ✅ Dependency Inversion Principle (DIP)
- 所有层都依赖接口而非具体实现
- 通过 DI 容器注入依赖

### 2. 安全最佳实践

#### 🔐 认证与授权
```csharp
// 基于策略的授权
[Authorize(Policy = PolicyNames.TechnicianOnly)]
public async Task<ActionResult> UpdateVehicleStatus(...)

// JWT Token 验证
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"));
```

#### 🔐 数据保护
```csharp
// 参数验证
public static Result<Location> Create(double latitude, double longitude)
{
    if (latitude < -90 || latitude > 90)
        return Result<Location>.Failure(new Error("Location.InvalidLatitude", "..."));
}

// SQL 注入防护 (使用参数化查询)
var queryDefinition = new QueryDefinition(sql)
    .WithParameter("@lon", center.Longitude)
    .WithParameter("@lat", center.Latitude);
```

#### 🔐 密钥管理
```csharp
// Azure Key Vault 集成
var endpoint = await _keyVaultService.GetSecretAsync("cosmos-endpoint");
var key = await _keyVaultService.GetSecretAsync("cosmos-key");
```

### 3. 性能优化策略

#### ⚡ 数据库优化
```javascript
// Cosmos DB 地理空间索引
{
  "spatialIndexes": [
    {
      "path": "/location/*",
      "types": ["Point"]
    }
  ]
}
```

#### ⚡ 前端优化
```typescript
// React.memo 防止不必要渲染
export const VehicleItem = React.memo<VehicleItemProps>(({ vehicle }) => {
    return <div>{vehicle.name}</div>;
});

// useCallback 缓存函数
const handleRefresh = useCallback(() => {
    fetchNearbyVehicles(location.latitude, location.longitude);
}, [location, fetchNearbyVehicles]);
```

#### ⚡ 延迟加载
```csharp
// 延迟初始化数据库连接
private readonly Lazy<Task<CosmosVehicleRepository>> _lazyRepository;
```

### 4. 错误处理策略

#### ⭐ Result Pattern
```csharp
// 业务逻辑错误不使用异常
public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
{
    if (newStatus == VehicleStatus.Unknown)
        return Result<VehicleStatus>.Failure(new Error("Vehicle.InvalidStatus", "..."));

    return Result<VehicleStatus>.Success(newStatus);
}
```

#### ⭐ 前端错误边界
```typescript
// 错误状态管理
const [error, setError] = useState<string | null>(null);

try {
    await vehicleService.rentVehicle(vehicleId);
} catch (err) {
    setError('Failed to rent vehicle');
}
```

### 5. 测试策略

#### 🧪 单元测试
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

#### 🧪 集成测试
```csharp
[Test]
public async Task GetNearbyVehicles_ShouldReturnVehiclesWithinRadius()
{
    // 使用 TestServer 进行端到端测试
    var response = await _client.GetAsync("/api/vehicles/nearby?latitude=47.6062&longitude=-122.3321&radius=5");

    response.EnsureSuccessStatusCode();
    var vehicles = await response.Content.ReadFromJsonAsync<List<VehicleSummaryDto>>();

    Assert.NotNull(vehicles);
}
```

---

## 📊 架构图示总结

### 数据流图

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

### 依赖关系图

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

## 🎓 总结与学习要点

### 核心设计理念

1. **分离关注点**: 不同层次负责不同职责
2. **依赖倒置**: 高层模块不依赖低层模块
3. **开放封闭**: 对扩展开放，对修改封闭
4. **单一职责**: 每个类只有一个变更原因
5. **接口隔离**: 客户端不应依赖不需要的接口

### 技术选择原则

1. **类型安全**: C# 和 TypeScript 提供编译时检查
2. **云原生**: 充分利用 Azure 服务能力
3. **可扩展性**: 微服务架构支持独立扩展
4. **安全性**: 企业级身份管理和授权
5. **性能**: 地理空间查询和缓存优化

### 未来扩展方向

1. **事件驱动架构**: 集成 Azure Event Hubs
2. **CQRS + Event Sourcing**: 完整的事件溯源
3. **微前端**: 模块化的前端架构
4. **API Gateway**: 统一的 API 管理
5. **监控与日志**: Application Insights 集成

---

**文档版本**: v1.0
**创建日期**: 2024-10-26
**适用版本**: .NET 8.0, React 19.2.0
**维护团队**: Vehicle Rental Development Team