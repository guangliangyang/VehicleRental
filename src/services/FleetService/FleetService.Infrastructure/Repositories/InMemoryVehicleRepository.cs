using FleetService.Application.Events;
using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Infrastructure.Repositories;

public sealed class InMemoryVehicleRepository : IVehicleRepository
{
    private readonly Dictionary<string, Vehicle> _vehicles = new();
    private readonly IDomainEventDispatcher _dispatcher;

    public InMemoryVehicleRepository(IDomainEventDispatcher dispatcher)
    {
        _dispatcher = dispatcher ?? throw new ArgumentNullException(nameof(dispatcher));
    }

    public Task<Vehicle?> GetByIdAsync(string vehicleId, CancellationToken cancellationToken)
    {
        _vehicles.TryGetValue(vehicleId, out var vehicle);
        return Task.FromResult(vehicle);
    }

    public Task<IReadOnlyList<Vehicle>> GetNearbyAsync(Location center, double radiusKilometers, CancellationToken cancellationToken)
    {
        var vehicles = _vehicles.Values
            .Where(v => CalculateDistance(center.Latitude, center.Longitude, v.Location.Latitude, v.Location.Longitude) <= radiusKilometers)
            .ToList();

        return Task.FromResult<IReadOnlyList<Vehicle>>(vehicles);
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        if (vehicle == null) throw new ArgumentNullException(nameof(vehicle));

        _vehicles[vehicle.Id.ToString()] = vehicle;

        var domainEvents = vehicle.DomainEvents.ToList();
        if (domainEvents.Any())
        {
            await _dispatcher.DispatchAsync(domainEvents, cancellationToken);
            vehicle.ClearDomainEvents();
        }
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in kilometers

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}