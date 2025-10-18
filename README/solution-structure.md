# Vehicle Rental System – Solution Structure

The repository is split into backend services, a React frontend, and deployment scripts.

## Backend (`src/services`)

- **FleetService** – main microservice following a layered architecture  
  - `FleetService.Api`: ASP.NET Minimal API host (routes, DI wiring, Swagger, SignalR config).  
  - `FleetService.Application`: application services (queries, commands, domain-event handling, DTOs).  
  - `FleetService.Domain`: core business rules (entities like `Vehicle`, value objects, domain events).  
  - `FleetService.Infrastructure`: integrations (Cosmos DB repository, SignalR notifications, configuration options).  
  - `FleetService.UnitTests`: unit tests covering application/domain logic.
- **VehicleSimulator** – console app that simulates telemetry messages to IoT Hub for vehicles.
- **VehicleRentalSystem.SharedKernel** – shared abstractions such as `Entity`, `Result`, domain-event contracts.
- **VehicleRentalSystem.sln** – solution file referencing all backend projects.

## Frontend (`src/web/vehicle-rental-web`)

React application (Create React App) that displays vehicle locations on a map/list, consumes the API, and listens to SignalR updates.

## Supporting assets

- **scripts/** – bash utilities for provisioning Azure resources, building/pushing Docker images, deploying to AKS, configuring API Management, uploading the frontend, etc.
- **tests/** – additional test projects.
- **Design/**, `README.md`, `CLAUDE.md`, etc. – documentation, architecture notes, examples.

### Data flow overview

API endpoints call into Application services, which use Domain models and Infrastructure implementations (Cosmos DB, SignalR). The React frontend invokes the API and responds to SignalR events, while the Vehicle Simulator can feed telemetry updates to keep vehicle data fresh. This keeps business logic isolated and technology details pluggable.***
