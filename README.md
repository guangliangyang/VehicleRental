# Vehicle Rental System - Vehicle Data Flow

This implementation demonstrates the Vehicle Data Flow from the IoT architecture design, featuring real-time vehicle telemetry processing with Azure services.

## Architecture Components

### Vehicle Data Flow (HotPath-Vehicle-Data-Flow.png)
1. **Vehicle TBOX Simulator** → Sends GPS/Status data via MQTT
2. **Azure IoT Hub** → Secure device gateway with identity management
3. **Azure Event Hubs** → High-throughput message buffer (Azure-managed)
4. **Stream Analytics** → Real-time filtering and processing (Azure-managed)
5. **Azure Cosmos DB** → Geo-spatial storage with live location updates

## Prerequisites

### Required Azure Services
Before running the system, you must create and configure these Azure services:
- **Azure Cosmos DB** (SQL API with geo-spatial indexing)
- **Azure Event Hubs** namespace and hub (configured in Stream Analytics)
- **Azure Stream Analytics** job (processes IoT Hub → Cosmos DB data flow)
- **Azure SignalR Service**
- **Azure IoT Hub** with device identities

### Device Setup
Create these device identities in IoT Hub:
- `TBOX-SEATTLE-001`
- `TBOX-SEATTLE-002`
- `TBOX-SEATTLE-003`

## Configuration

Configure your Azure services in `appsettings.json`:

```json
{
  "Cosmos": {
    "Endpoint": "https://your-cosmos-account.documents.azure.com:443/",
    "Key": "your-cosmos-primary-key",
    "DatabaseId": "fleet",
    "ContainerId": "Vehicles"
  },
  "SignalR": {
    "ConnectionString": "Endpoint=https://your-signalr-service.service.signalr.net;AccessKey=your-access-key",
    "HubName": "vehicles"
  },
  "IoTHub": {
    "ConnectionString": "HostName=your-iothub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=your-key",
    "SendIntervalSeconds": 5
  }
}
```

## Running the System

```bash
# Start the Fleet Service API
dotnet run --project src/services/FleetService/FleetService.Api

# Start the Vehicle Simulator (sends telemetry data)
dotnet run --project src/services/VehicleSimulator
```

## Architecture Features

### Real-time Processing
- **Azure Stream Analytics**: Validates speed, heading, and message age (Azure-managed)
- **Geo-spatial queries**: Uses Cosmos DB `ST_DISTANCE` for nearby vehicle searches
- **Live updates**: SignalR pushes location changes to connected clients

### Data Flow Components
- **VehicleTelemetryMessage**: Extended model with Status, Speed, Heading
- **Azure Stream Analytics**: Implements filtering and writes to Cosmos DB (Azure-managed)
- **CosmosVehicleRepository**: Geo-spatial storage with GeoJSON Point format

### Production Features
- **Azure-native**: Fully integrated with Azure IoT and data services
- **Geo-spatial storage**: Cosmos DB with spatial indexing for efficient queries
- **Real-time telemetry**: Live vehicle data processing and updates

## Testing the System

### API Testing
```bash
# Get nearby vehicles (Seattle downtown area)
curl "http://localhost:5001/vehicles/nearby?latitude=47.6062&longitude=-122.3321&radius=5"

# Test different radius values
curl "http://localhost:5001/vehicles/nearby?latitude=47.6062&longitude=-122.3321&radius=1"  # 1km
curl "http://localhost:5001/vehicles/nearby?latitude=47.6062&longitude=-122.3321&radius=10" # 10km

# View API documentation
open http://localhost:5001/swagger
```

### Azure Stream Analytics Filtering
Configure your Stream Analytics job to filter out invalid telemetry:
- Speed outside 0-200 km/h range
- Heading outside 0-360 degrees
- Messages older than 5 minutes

## Project Structure

```
src/services/
├── VehicleSimulator/              # TBOX device simulator
├── FleetService.Api/              # REST API endpoints
├── FleetService.Infrastructure/   # Cosmos DB + SignalR
├── FleetService.Domain/           # Vehicle aggregate + events
└── FleetService.Application/      # Query services + DTOs
```

This system implements a production-ready IoT vehicle rental platform with Azure native services. The data flow (IoT Hub → Event Hubs → Stream Analytics → Cosmos DB) is handled entirely by Azure services, requiring no custom telemetry processing code.