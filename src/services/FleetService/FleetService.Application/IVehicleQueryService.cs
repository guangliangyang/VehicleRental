using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application;

public interface IVehicleQueryService
{
    Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehiclesAsync(NearbyVehiclesQuery query, CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<VehicleSummaryDto>>> GetUserVehiclesAsync(string userId, CancellationToken cancellationToken = default);
}
