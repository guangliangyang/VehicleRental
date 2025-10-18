using VehicleRentalSystem.SharedKernel;

namespace FleetService.Domain;

public sealed class Vehicle : Entity<string>, IAggregateRoot
{
    private Vehicle(string id, Location location, VehicleStatus status)
    {
        Id = id;
        _location = location;
        _status = status;
    }

    private Location _location;
    private VehicleStatus _status;

    public Location Location => _location;

    public VehicleStatus Status => _status;

    public static Result<Vehicle> Create(string id, Location location, VehicleStatus status)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return Result<Vehicle>.Failure(new Error("Vehicle.InvalidId", "Vehicle id must be non-empty."));
        }

        ArgumentNullException.ThrowIfNull(location);

        return Result<Vehicle>.Success(new Vehicle(id.Trim(), location, status));
    }

    public Result<VehicleStatus> UpdateStatus(VehicleStatus newStatus)
    {
        if (!Enum.IsDefined(typeof(VehicleStatus), newStatus) || newStatus == VehicleStatus.Unknown)
        {
            return Result<VehicleStatus>.Failure(new Error("Vehicle.InvalidStatus", "Unsupported vehicle status."));
        }

        if (_status == newStatus)
        {
            return Result<VehicleStatus>.Success(_status);
        }

        _status = newStatus;
        RaiseDomainEvent(new VehicleStatusChangedDomainEvent(Id, newStatus));
        return Result<VehicleStatus>.Success(_status);
    }

    public void UpdateLocation(Location location)
    {
        ArgumentNullException.ThrowIfNull(location);
        _location = location;
        RaiseDomainEvent(new VehicleLocationUpdatedDomainEvent(Id, location.Latitude, location.Longitude));
    }
}
