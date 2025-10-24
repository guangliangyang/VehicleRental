namespace FleetService.Domain;

public interface IVehicleRepository
{
    Task<IReadOnlyList<Vehicle>> GetNearbyAsync(Location center, double radiusKilometers, CancellationToken cancellationToken);
    Task<Vehicle?> GetByIdAsync(string vehicleId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Vehicle>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken);
}
