namespace VehicleSimulator.Models;

public sealed record VehicleTelemetryMessage(
    string VehicleId,
    double Latitude,
    double Longitude,
    string Status,
    double Speed,
    double Heading,
    DateTimeOffset Timestamp,
    string DeviceId);

public enum VehicleStatus
{
    Available,
    Rented,
    Maintenance,
    OutOfService
}

public sealed record LocationPoint(double Latitude, double Longitude);

public sealed record VehicleRoute(string Name, LocationPoint[] Points);