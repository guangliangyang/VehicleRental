using System.Linq;
using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application;

public interface IVehicleQueryService
{
    Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehiclesAsync(NearbyVehiclesQuery query, CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetUserVehiclesAsync(string userId, CancellationToken cancellationToken = default);
}

public sealed class VehicleQueryService : IVehicleQueryService
{
    private readonly IVehicleRepository _repository;

    public VehicleQueryService(IVehicleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehiclesAsync(NearbyVehiclesQuery query, CancellationToken cancellationToken = default)
    {
        var locationResult = Location.Create(query.Latitude, query.Longitude);
        if (locationResult.IsFailure || locationResult.Value is null)
        {
            return Result<IReadOnlyList<VehicleSummaryDto>>.Failure(locationResult.Error ?? new Error("Location.Unknown", "Unknown error."));
        }

        if (query.RadiusKilometers <= 0)
        {
            return Result<IReadOnlyList<VehicleSummaryDto>>.Failure(new Error("Vehicle.InvalidRadius", "Radius must be greater than zero."));
        }

        var vehicles = await _repository.GetNearbyAsync(locationResult.Value, query.RadiusKilometers, cancellationToken);
        var summaries = vehicles
            .Select(vehicle => new VehicleSummaryDto(
                vehicle.Id,
                vehicle.Location.Latitude,
                vehicle.Location.Longitude,
                vehicle.Status.ToString()))
            .ToList();

        return Result<IReadOnlyList<VehicleSummaryDto>>.Success(summaries);
    }

    public async Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetUserVehiclesAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result<IReadOnlyList<VehicleSummaryDto>>.Failure(new Error("Vehicle.InvalidUserId", "User ID cannot be null or empty."));
        }

        var vehicles = await _repository.GetByUserIdAsync(userId, cancellationToken);
        var summaries = vehicles
            .Select(vehicle => new VehicleSummaryDto(
                vehicle.Id,
                vehicle.Location.Latitude,
                vehicle.Location.Longitude,
                vehicle.Status.ToString()))
            .ToList();

        return Result<IReadOnlyList<VehicleSummaryDto>>.Success(summaries);
    }
}
