using FleetService.Api.Authorization;
using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Api.Services;

/// <summary>
/// Service for validating vehicle status transitions based on user roles.
/// Implements role-based business rules for vehicle status management.
/// </summary>
public sealed class VehicleStatusValidator : IVehicleStatusValidator
{
    private readonly IRoleService _roleService;

    public VehicleStatusValidator(IRoleService roleService)
    {
        _roleService = roleService ?? throw new ArgumentNullException(nameof(roleService));
    }

    public Result<Unit> ValidateStatusTransition(VehicleStatus fromStatus, VehicleStatus toStatus)
    {
        // If technician, allow all transitions except to Unknown
        if (_roleService.IsTechnician())
        {
            if (toStatus == VehicleStatus.Unknown)
            {
                return Result<Unit>.Failure(new Error("VehicleStatus.InvalidTransition",
                    "Cannot transition vehicle status to Unknown"));
            }
            return Result<Unit>.Success(Unit.Value);
        }

        // Regular users can only perform rental-related transitions
        if (_roleService.IsUser())
        {
            var allowedTransitions = GetUserAllowedTransitions();
            var transition = (fromStatus, toStatus);

            if (allowedTransitions.Contains(transition))
            {
                return Result<Unit>.Success(Unit.Value);
            }

            return Result<Unit>.Failure(new Error("VehicleStatus.UnauthorizedTransition",
                $"Users cannot transition vehicle status from {fromStatus} to {toStatus}"));
        }

        // No recognized role
        return Result<Unit>.Failure(new Error("User.InvalidRole",
            "User does not have required roles to modify vehicle status"));
    }

    public IEnumerable<VehicleStatus> GetAllowedTransitions(VehicleStatus currentStatus)
    {
        if (_roleService.IsTechnician())
        {
            return GetTechnicianAllowedTransitions(currentStatus);
        }

        if (_roleService.IsUser())
        {
            return GetUserAllowedTransitions(currentStatus);
        }

        return Enumerable.Empty<VehicleStatus>();
    }

    private static IEnumerable<VehicleStatus> GetTechnicianAllowedTransitions(VehicleStatus currentStatus)
    {
        // Technicians can transition to any status except Unknown
        return new[]
        {
            VehicleStatus.Available,
            VehicleStatus.Maintenance,
            VehicleStatus.OutOfService,
            VehicleStatus.Rented
        }.Where(status => status != currentStatus);
    }

    private static IEnumerable<VehicleStatus> GetUserAllowedTransitions(VehicleStatus currentStatus)
    {
        // Users can only perform rental operations
        return currentStatus switch
        {
            VehicleStatus.Available => new[] { VehicleStatus.Rented },
            VehicleStatus.Rented => new[] { VehicleStatus.Available },
            _ => Enumerable.Empty<VehicleStatus>()
        };
    }

    private static IEnumerable<(VehicleStatus From, VehicleStatus To)> GetUserAllowedTransitions()
    {
        return new[]
        {
            (VehicleStatus.Available, VehicleStatus.Rented),  // Rent vehicle
            (VehicleStatus.Rented, VehicleStatus.Available)   // Return vehicle
        };
    }
}