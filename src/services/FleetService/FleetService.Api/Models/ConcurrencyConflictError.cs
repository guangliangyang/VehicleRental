using FleetService.Domain;

namespace FleetService.Api.Models;

/// <summary>
/// Represents a concurrency conflict error response
/// </summary>
public sealed record ConcurrencyConflictError(
    string Code,
    string Message,
    VehicleStatus ExpectedCurrentStatus,
    VehicleStatus AttemptedNewStatus,
    VehicleStatus ActualCurrentStatus
);