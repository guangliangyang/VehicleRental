using FleetService.Domain;

namespace FleetService.Api.Models;

/// <summary>
/// Request model for updating vehicle status with optimistic concurrency control
/// </summary>
public sealed record UpdateVehicleStatusRequest(VehicleStatus ExpectedCurrentStatus, VehicleStatus NewStatus);