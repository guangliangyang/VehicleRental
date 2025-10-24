using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application;

public interface IVehicleCommandService
{
    Task<Result<Unit>> UpdateVehicleStatusAsync(string vehicleId, VehicleStatus expectedCurrentStatus, VehicleStatus newStatus, CancellationToken cancellationToken = default);

    Task<Result<Unit>> RentVehicleAsync(string vehicleId, string userId, CancellationToken cancellationToken = default);

    Task<Result<Unit>> ReturnVehicleAsync(string vehicleId, string userId, CancellationToken cancellationToken = default);
}