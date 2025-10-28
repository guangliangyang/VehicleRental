# Local Development Setup

This guide helps you set up the Vehicle Rental System for local development.

## Prerequisites

- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Azure CLI** - [Install](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Git** - [Install](https://git-scm.com/downloads)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd VehicleRental
```

### 2. Setup Configuration
```bash
# Copy configuration templates
cp config/development/api.env src/services/FleetService/FleetService.Api/.env
cp config/production/frontend.env src/web/vehicle-rental-web/.env.production
```

### 3. Start Backend Services
```bash
# Build and run the .NET API
dotnet build src/services/VehicleRentalSystem.sln
dotnet run --project src/services/FleetService/FleetService.Api --urls "http://localhost:5000"
```

### 4. Start Frontend
```bash
# Install dependencies and start React app
cd src/web/vehicle-rental-web
npm install
npm start
```

### 5. Start Vehicle Simulator (Optional)
```bash
# In a separate terminal
dotnet run --project src/services/VehicleSimulator
```

## Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Fleet API | http://localhost:5000 | Main backend API |
| Swagger UI | http://localhost:5000/swagger | API documentation |
| React Frontend | http://localhost:3000 | Web application |

## Development Tools

### Running Tests
```bash
# Run all tests
dotnet test src/services/VehicleRentalSystem.sln

# Run specific test project
dotnet test tests/unit/FleetService.UnitTests
dotnet test tests/integration/FleetService.IntegrationTests
```

### Code Quality
```bash
# Check for build warnings (treated as errors)
dotnet build src/services/VehicleRentalSystem.sln

# Code formatting (if available)
dotnet format src/services/VehicleRentalSystem.sln
```

## Configuration Details

### Backend Configuration (`.env`)
```env
# Cosmos DB Configuration
COSMOS_ENDPOINT=https://cosmos-db-vc2.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_ID=cosmosdb-vc2
COSMOS_CONTAINER_ID=cosmosdb-vc2-container


# Application Configuration
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000;https://localhost:5001
```

### Frontend Configuration (`.env.production`)
```env
# API endpoint
REACT_APP_API_URL=http://localhost:5000
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find and kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Cosmos DB connection issues**
   - Verify your Cosmos DB endpoint and key
   - Check network connectivity
   - Ensure the database and container exist

3. **Node modules issues**
   ```bash
   cd src/web/vehicle-rental-web
   rm -rf node_modules package-lock.json
   npm install
   ```

### Development Scripts

Use the scripts in the `scripts/` directory for common tasks:
- `scripts/dev-setup.sh` - Complete development environment setup
- `scripts/build.sh` - Build all components
- `scripts/test.sh` - Run all tests
- `scripts/clean.sh` - Clean build artifacts