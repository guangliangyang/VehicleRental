# Cosmos DB Geospatial Configuration

The FleetService uses Cosmos DB's native geospatial capabilities with a `location` field containing GeoJSON Point data for optimal spatial queries.

## Database Schema

### VehicleDocument Structure

```json
{
  "id": "vehicle-guid",
  "vehicleId": "vehicle-guid",
  "vin": "VIN123456789",
  "displayName": "Seattle Downtown EV",
  "latitude": 47.6062,
  "longitude": -122.3321,
  "status": "Available",
  "location": {
    "type": "Point",
    "coordinates": [-122.3321, 47.6062]
  }
}
```

## Required Configuration

### Spatial Index Configuration (via IaC - Terraform/ARM)

```json
{
  "indexingPolicy": {
    "indexingMode": "consistent",
    "automatic": true,
    "includedPaths": [
      {
        "path": "/*"
      }
    ],
    "excludedPaths": [
      {
        "path": "/\"_etag\"/?"
      }
    ],
    "spatialIndexes": [
      {
        "path": "/location/*",
        "types": ["Point"]
      }
    ]
  }
}
```

## SQL Query Pattern

The repository uses this optimized query pattern:

```sql
SELECT * FROM c WHERE
ST_DISTANCE(c.location, {'type':'Point','coordinates':[longitude, latitude]}) <= maxDistanceInMeters
```

## Data Model Features

- **Dual Storage**: Both individual `latitude`/`longitude` fields and GeoJSON `location` field
- **Computed Property**: `Location` is calculated from coordinates during writes
- **Optimal Performance**: Uses native Cosmos DB spatial indexing
- **GeoJSON Standard**: Follows [longitude, latitude] coordinate order

## Benefits

- ✅ **High Performance**: Native spatial indexing
- ✅ **Standard Compliance**: GeoJSON Point format
- ✅ **Query Optimization**: Efficient ST_DISTANCE operations
- ✅ **Backward Compatibility**: Maintains individual coordinate fields