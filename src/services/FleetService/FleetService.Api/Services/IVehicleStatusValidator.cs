using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Api.Services;

/// <summary>
/// Service for validating vehicle status transitions based on user roles
/// </summary>
public interface IVehicleStatusValidator
{
    /// <summary>
    /// Validates if the current user can transition a vehicle from one status to another
    /// </summary>
    /// <param name="fromStatus">Current vehicle status</param>
    /// <param name="toStatus">Desired vehicle status</param>
    /// <returns>Success if transition is allowed, failure with error details if not</returns>
    Result<Unit> ValidateStatusTransition(VehicleStatus fromStatus, VehicleStatus toStatus);

    /// <summary>
    /// Gets the allowed target statuses for the current user from a given current status
    /// </summary>
    /// <param name="currentStatus">Current vehicle status</param>
    /// <returns>Collection of allowed target statuses</returns>
    IEnumerable<VehicleStatus> GetAllowedTransitions(VehicleStatus currentStatus);
}