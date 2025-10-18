using VehicleRentalSystem.SharedKernel;

namespace FleetService.Domain;

public sealed record VehicleStatusChangedDomainEvent(string VehicleId, VehicleStatus Status) : DomainEvent;

public sealed record VehicleLocationUpdatedDomainEvent(string VehicleId, double Latitude, double Longitude) : DomainEvent;
