# Vehicle Rental System

A production-ready IoT vehicle rental platform built with **.NET 8**, **React**, and **Azure services**, featuring real-time vehicle telemetry processing and geo-spatial fleet management.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/guangliangyang/VehicleRental.git
cd VehicleRental

# Setup development environment (copies configs, installs dependencies, builds, tests)
./scripts/dev-setup.sh

# Start backend API
dotnet run --project src/services/FleetService/FleetService.Api --urls "http://localhost:5000"

# Start frontend (in separate terminal)
cd src/web/vehicle-rental-web && npm start

# Start vehicle simulator (optional)
dotnet run --project src/services/VehicleSimulator
```

**Access Points:**
- **API**: http://localhost:5000
- **Swagger**: http://localhost:5000/swagger
- **Frontend**: http://localhost:3000

## 🏗️ Architecture

### Clean Architecture + DDD
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │────│   .NET 8 API    │────│   Azure Cloud   │
│                 │    │                  │    │                 │
│ • Vehicle Map   │    │ • Clean Arch     │    │ • Cosmos DB     │
│ • Real-time UI  │    │ • DDD Patterns   │    │ • IoT Hub       │
│ • Live Updates  │    │ • Result Pattern │    │ • Key Vault     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Vehicle Data Flow
```
Vehicle TBOX → IoT Hub → Event Hubs → Stream Analytics → Cosmos DB
                                                              ↓
React Frontend ← Polling ← Fleet API ← Real-time Updates ←────┘
```

## 🛠️ Technology Stack

**Backend (.NET 8)**
- **Clean Architecture** with Domain-Driven Design
- **ASP.NET Core** with Minimal APIs
- **Azure Cosmos DB** for geo-spatial storage
- **Result Pattern** for robust error handling
- **xUnit** for comprehensive testing

**Frontend (React)**
- **React 18** with TypeScript
- **Real-time map** integration
- **Polling mechanism** for live updates
- **Responsive design**

**Cloud (Azure)**
- **Container Apps** for serverless deployment
- **Cosmos DB** with geo-spatial indexing
- **Key Vault** for secret management
- **Terraform** for Infrastructure as Code

## 📁 Project Structure

```
VehicleRental/
├── 📁 src/                          # Source code
│   ├── 📁 services/                 # Backend services (.NET)
│   │   ├── FleetService.Domain/     # Domain entities & business logic
│   │   ├── FleetService.Application/# Use cases & application services
│   │   ├── FleetService.Infrastructure/# Data access & external services
│   │   ├── FleetService.Api/        # REST API & controllers
│   │   ├── VehicleSimulator/        # IoT device simulator
│   │   └── SharedKernel/            # Common domain primitives
│   └── 📁 web/                      # Frontend applications
│       └── vehicle-rental-web/      # React SPA
├── 📁 tests/                        # All test projects
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
├── 📁 infra/                        # Infrastructure as Code
│   ├── container-apps/              # Terraform for Azure Container Apps
│   └── archive/                     # Legacy configurations
├── 📁 docs/                         # Documentation
│   ├── architecture/                # System design & ADRs
│   ├── api/                         # API documentation
│   ├── deployment/                  # Deployment guides
│   └── development/                 # Development setup
├── 📁 config/                       # Configuration templates
│   ├── development/                 # Local development configs
│   ├── staging/                     # Staging environment configs
│   └── production/                  # Production environment configs
└── 📁 scripts/                      # Development workflow scripts
    ├── build.sh                     # Build all components
    ├── test.sh                      # Run all tests
    ├── dev-setup.sh                 # Setup development environment
    └── clean.sh                     # Clean build artifacts
```

## 🧪 Development Workflow

```bash
# Build all components
./scripts/build.sh

# Run all tests (unit + integration)
./scripts/test.sh

# Clean build artifacts
./scripts/clean.sh
```

## 🌐 Deployment

**Azure Container Apps** (Recommended)
```bash
cd infra/container-apps
terraform init
terraform apply
```

See [deployment documentation](docs/deployment/) for detailed guides.

## 🔑 Configuration

Use template files for secure configuration:

```bash
# Copy and customize configuration templates
cp config/development/api.env.template config/development/api.env
cp config/production/frontend.env.template config/production/frontend.env

# Edit with your actual Azure credentials
# Then copy to application locations
```

## 📚 Documentation

- **[Getting Started](docs/development/local-setup.md)** - Local development setup
- **[Architecture](docs/architecture/)** - System design and patterns
- **[API Reference](docs/api/)** - REST API documentation
- **[Deployment](docs/deployment/)** - Infrastructure and deployment
- **[Configuration](config/README.md)** - Environment setup

## 🏢 Enterprise Features

- **🛡️ Security**: Azure Key Vault integration with DefaultAzureCredential
- **📈 Monitoring**: Application Insights and health checks
- **🔄 CI/CD**: GitHub Actions with Infrastructure as Code
- **🧪 Testing**: Unit, integration, and E2E test coverage
- **📝 Documentation**: Comprehensive docs and ADRs
- **🏗️ Scalability**: Azure Container Apps with auto-scaling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for modern cloud-native development**