using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application;

public sealed class VehicleCommandService : IVehicleCommandService
{
    private readonly IVehicleRepository _repository;

    public VehicleCommandService(IVehicleRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<Unit>> UpdateVehicleStatusAsync(string vehicleId, VehicleStatus expectedCurrentStatus, VehicleStatus newStatus, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(vehicleId))
        {
            return Result<Unit>.Failure(new Error("Vehicle.InvalidId", "Vehicle ID is required."));
        }

        var vehicle = await _repository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null)
        {
            return Result<Unit>.Failure(new Error("Vehicle.NotFound", $"Vehicle with ID '{vehicleId}' not found."));
        }

        // Optimistic concurrency control: Check if current status matches expected status
        if (vehicle.Status != expectedCurrentStatus)
        {
            var concurrencyError = new Error(
                "Vehicle.ConcurrencyConflict",
                $"Vehicle status has been modified by another user. Expected: {expectedCurrentStatus}, Actual: {vehicle.Status}"
            );
            return Result<Unit>.Failure(concurrencyError);
        }

        var updateResult = vehicle.UpdateStatus(newStatus);
        if (updateResult.IsFailure)
        {
            return Result<Unit>.Failure(updateResult.Error ?? Error.None);
        }

        await _repository.SaveAsync(vehicle, cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}