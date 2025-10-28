# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
```bash
# Build the entire solution
dotnet build src/services/VehicleRentalSystem.sln

# Run the Fleet Service API (default port 5001)
dotnet run --project src/services/FleetService/FleetService.Api


# Run the Vehicle TBOX Simulator (sends telemetry data)
dotnet run --project src/services/VehicleSimulator
```

### Testing
```bash
# Run all tests
dotnet test src/services/VehicleRentalSystem.sln

# Run specific test project (CORRECT LOCATION)
dotnet test tests/unit/FleetService.UnitTests

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Test Project Structure (IMPORTANT)
Tests should ONLY be located in `/tests/` directory, NOT in `/src/`:
```
/tests/
├── unit/
│   ├── FleetService.UnitTests/           ✅ CORRECT
│   └── VehicleRentalSystem.SharedKernel.Tests/
└── integration/
    └── FleetService.IntegrationTests/

/src/services/FleetService/
├── FleetService.Api/                     ✅ Source code only
├── FleetService.Domain/
└── FleetService.UnitTests/              ❌ WRONG LOCATION - DO NOT CREATE
```

## Architecture Overview

This is a **Vehicle Rental System** built with **.NET 8** following **Clean Architecture** and **Domain-Driven Design (DDD)** principles. The system currently implements the **Fleet Service** microservice which handles vehicle location tracking and availability management.

### Solution Structure
- **VehicleRentalSystem.SharedKernel** - Common domain primitives, base classes, and the Result pattern
- **FleetService.Domain** - Core business logic, entities (Vehicle), value objects (Location), and domain events
- **FleetService.Application** - Application services, query handlers, and DTOs
- **FleetService.Infrastructure** - Data persistence (Cosmos DB) and external integrations
- **FleetService.Api** - Web API with minimal APIs, Swagger documentation
- **FleetService.UnitTests** - Unit tests using xUnit
- **VehicleSimulator** - TBOX device simulator that sends GPS/status data to IoT Hub

### Key Design Patterns

#### Clean Architecture Layers
- **Domain Layer**: Entities, value objects, domain events (no external dependencies)
- **Application Layer**: Use cases, query services, domain event handlers
- **Infrastructure Layer**: Repository implementations, external service clients
- **API Layer**: Controllers, minimal APIs, dependency injection setup

#### Domain-Driven Design
- **Vehicle** aggregate root with business logic for status changes and location updates
- **Location** value object with geospatial coordinates and validation
- **Domain events** for Vehicle status and location changes
- **Repository pattern** with Cosmos DB implementation

#### Result Pattern
All operations return `Result<T>` instead of throwing exceptions for business logic failures. Check `result.IsSuccess` and `result.IsFailure` properties.

## Configuration

### Required Azure Services Configuration
All Azure services must be configured in `appsettings.json`:
- **Cosmos DB**: Set `Cosmos:Endpoint` and `Cosmos:Key` for vehicle data persistence (required)
- **Event Hubs + Stream Analytics**: Configure for telemetry processing pipeline (Azure-managed)
- **IoT Hub**: Set `IoTHub:ConnectionString` for device connectivity (required)

### Key Endpoints
- `GET /vehicles/nearby?latitude={lat}&longitude={lng}&radius={km}` - Find vehicles within radius (default 5km)
- `/swagger` - API documentation (Development environment only)

## Vehicle Data Flow Implementation

This codebase implements the complete **Vehicle Data Flow** from the IoT architecture design:

### Data Flow Components
1. **VehicleSimulator** - TBOX device simulator sending GPS/status via MQTT to IoT Hub
2. **Azure IoT Hub** - Device gateway (configured via connection strings)
3. **Azure Event Hubs** - Message buffer for telemetry ingestion
4. **Azure Stream Analytics** - Filtering and processing (Azure-managed)
5. **Cosmos DB** - Geo-spatial storage with real-time location updates

### Enhanced Telemetry Model
```csharp
VehicleTelemetryMessage(
    Guid VehicleId,
    double Latitude,
    double Longitude,
    string Status,        // Available, Rented, Maintenance, OutOfService
    double Speed,         // km/h
    double Heading,       // degrees
    DateTimeOffset Timestamp,
    string? DeviceId)
```

### Stream Analytics Filtering
- Speed validation (0-200 km/h)
- Heading validation (0-360 degrees)
- Message age filtering (< 5 minutes)
- Invalid coordinate rejection

### Geo-spatial Features
- **Cosmos DB indexing**: Spatial index on `/location/*` with Point geometry
- **Distance queries**: `ST_DISTANCE` function for nearby vehicle searches
- **GeoJSON format**: Location stored as `{"type":"Point","coordinates":[lng,lat]}`

## Core Domain Concepts

### Vehicle Entity
- **Aggregate root** with ID, VIN, Name, Location, Status
- **Business methods**: UpdateLocation(), UpdateStatus(), Rent(), Return()
- **Domain events** fired on state changes

### Location Value Object
- Encapsulates latitude/longitude with validation
- Used for geospatial queries in Cosmos DB
- Immutable with equality comparison

### Vehicle Status Enumeration
- Available, Rented, Maintenance, OutOfService
- Managed through domain methods with business rule validation

## Technology Stack

- **.NET 8.0** with nullable reference types and implicit usings
- **ASP.NET Core** with minimal APIs
- **xUnit** for testing with coverlet for code coverage
- **Azure Cosmos DB** for geospatial data storage
- **Swashbuckle** for OpenAPI/Swagger documentation

## Development Notes

### Code Quality
- **TreatWarningsAsErrors** is enabled across all projects
- **Nullable reference types** are enforced
- Use the **Result pattern** for error handling instead of exceptions
- Follow **Clean Architecture** dependency rules (inner layers don't depend on outer layers)

### Testing Strategy
- Unit tests focus on domain logic and application services
- Use mock implementations for repository testing
- Domain events use `NoOpDispatcher` for isolated testing
- Test both success and failure scenarios with the Result pattern