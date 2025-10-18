using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application;

public interface IVehicleCommandService
{
    Task<Result<Unit>> UpdateVehicleStatusAsync(string vehicleId, VehicleStatus expectedCurrentStatus, VehicleStatus newStatus, CancellationToken cancellationToken = default);
}