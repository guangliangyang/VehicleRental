namespace FleetService.Application;

public sealed record VehicleSummaryDto(string VehicleId, double Latitude, double Longitude, string Status);
