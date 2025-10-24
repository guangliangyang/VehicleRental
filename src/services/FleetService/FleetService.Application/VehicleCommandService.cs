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

    public async Task<Result<Unit>> RentVehicleAsync(string vehicleId, string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(vehicleId))
        {
            return Result<Unit>.Failure(new Error("Vehicle.InvalidId", "Vehicle ID is required."));
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result<Unit>.Failure(new Error("Vehicle.InvalidUserId", "User ID is required."));
        }

        var vehicle = await _repository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null)
        {
            return Result<Unit>.Failure(new Error("Vehicle.NotFound", $"Vehicle with ID '{vehicleId}' not found."));
        }

        // Business rule: Only available vehicles can be rented
        if (vehicle.Status != VehicleStatus.Available)
        {
            return Result<Unit>.Failure(new Error("Vehicle.NotAvailable", $"Vehicle is not available for rent. Current status: {vehicle.Status}"));
        }

        var rentResult = vehicle.Rent();
        if (rentResult.IsFailure)
        {
            return Result<Unit>.Failure(rentResult.Error ?? Error.None);
        }

        await _repository.SaveAsync(vehicle, cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ReturnVehicleAsync(string vehicleId, string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(vehicleId))
        {
            return Result<Unit>.Failure(new Error("Vehicle.InvalidId", "Vehicle ID is required."));
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result<Unit>.Failure(new Error("Vehicle.InvalidUserId", "User ID is required."));
        }

        var vehicle = await _repository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null)
        {
            return Result<Unit>.Failure(new Error("Vehicle.NotFound", $"Vehicle with ID '{vehicleId}' not found."));
        }

        // Business rule: Only rented vehicles can be returned
        if (vehicle.Status != VehicleStatus.Rented)
        {
            return Result<Unit>.Failure(new Error("Vehicle.NotRented", $"Vehicle is not currently rented. Current status: {vehicle.Status}"));
        }

        var returnResult = vehicle.Return();
        if (returnResult.IsFailure)
        {
            return Result<Unit>.Failure(returnResult.Error ?? Error.None);
        }

        await _repository.SaveAsync(vehicle, cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}