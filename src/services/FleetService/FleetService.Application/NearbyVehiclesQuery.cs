namespace FleetService.Application;

public sealed record NearbyVehiclesQuery(double Latitude, double Longitude, double RadiusKilometers = 5);
