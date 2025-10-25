using FleetService.Api.Authorization;
using FleetService.Api.Models;
using FleetService.Api.Services;
using FleetService.Application;
using FleetService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Api.Controllers;

[ApiController]
[Route("vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleQueryService _queryService;
    private readonly IVehicleCommandService _commandService;
    private readonly IUserContextService _userContextService;
    private readonly IVehicleStatusValidator _statusValidator;

    public VehiclesController(
        IVehicleQueryService queryService,
        IVehicleCommandService commandService,
        IUserContextService userContextService,
        IVehicleStatusValidator statusValidator)
    {
        _queryService = queryService;
        _commandService = commandService;
        _userContextService = userContextService;
        _statusValidator = statusValidator;
    }

    /// <summary>
    /// Gets nearby vehicles within specified radius (Anonymous access allowed)
    /// </summary>
    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehicles(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double? radius = 5)
    {
        // Anonymous access allowed for nearby vehicle search
        var query = new NearbyVehiclesQuery(latitude, longitude, radius.GetValueOrDefault(5));
        var result = await _queryService.GetNearbyVehiclesAsync(query);

        return result.IsSuccess && result.Value is not null
            ? Ok(result.Value)
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Updates vehicle status with optimistic concurrency control (Technician only)
    /// </summary>
    [HttpPut("{vehicleId}/status")]
    [Authorize(Policy = PolicyNames.TechnicianOnly)]
    public async Task<ActionResult<ApiSuccess>> UpdateVehicleStatus(
        string vehicleId,
        [FromBody] UpdateVehicleStatusRequest request)
    {
        // Validate status transition based on user role
        var validationResult = _statusValidator.ValidateStatusTransition(request.ExpectedCurrentStatus, request.NewStatus);
        if (validationResult.IsFailure)
        {
            var error = validationResult.Error ?? new Error("Unknown", "Unknown validation error");
            return BadRequest(new ApiError(error.Code, error.Message));
        }

        // Only technicians can update vehicle status to maintenance/out-of-service
        var result = await _commandService.UpdateVehicleStatusAsync(vehicleId, request.ExpectedCurrentStatus, request.NewStatus);

        if (result.IsSuccess)
        {
            return Ok(new ApiSuccess("Vehicle status updated successfully"));
        }

        if (result.Error?.Code == "Vehicle.ConcurrencyConflict")
        {
            // Extract actual current status from error message
            // Message format: "Vehicle status has been modified by another user. Expected: {expectedStatus}, Actual: {actualStatus}"
            var actualCurrentStatus = request.ExpectedCurrentStatus; // fallback
            var message = result.Error.Value.Message;
            var actualIndex = message.IndexOf("Actual: ");
            if (actualIndex >= 0)
            {
                var statusText = message.Substring(actualIndex + 8);
                if (Enum.TryParse<VehicleStatus>(statusText, out var parsedStatus))
                {
                    actualCurrentStatus = parsedStatus;
                }
            }

            return Conflict(new ConcurrencyConflictError(
                result.Error.Value.Code,
                result.Error.Value.Message,
                request.ExpectedCurrentStatus,
                request.NewStatus,
                actualCurrentStatus
            ));
        }

        return BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Gets vehicles rented by the current user (Authenticated users only)
    /// </summary>
    [HttpGet("user")]
    [Authorize(Policy = PolicyNames.AuthenticatedUser)]
    public async Task<ActionResult<IReadOnlyList<VehicleSummaryDto>>> GetUserVehicles()
    {
        // Authenticated users can view their rented vehicles
        var userId = _userContextService.GetUserId();
        var result = await _queryService.GetUserVehiclesAsync(userId);

        return result.IsSuccess && result.Value is not null
            ? Ok(result.Value)
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Rents a vehicle for the current user (Authenticated users only)
    /// </summary>
    [HttpPost("{vehicleId}/rent")]
    [Authorize(Policy = PolicyNames.AuthenticatedUser)]
    public async Task<ActionResult<ApiSuccess>> RentVehicle(string vehicleId)
    {
        // Authenticated users can rent available vehicles
        var userId = _userContextService.GetUserId();
        var result = await _commandService.RentVehicleAsync(vehicleId, userId);

        return result.IsSuccess
            ? Ok(new ApiSuccess($"Vehicle {vehicleId} rented successfully"))
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Returns a vehicle from the current user (Authenticated users only)
    /// </summary>
    [HttpPost("{vehicleId}/return")]
    [Authorize(Policy = PolicyNames.AuthenticatedUser)]
    public async Task<ActionResult<ApiSuccess>> ReturnVehicle(string vehicleId)
    {
        // Authenticated users can return their rented vehicles
        var userId = _userContextService.GetUserId();
        var result = await _commandService.ReturnVehicleAsync(vehicleId, userId);

        return result.IsSuccess
            ? Ok(new ApiSuccess($"Vehicle {vehicleId} returned successfully"))
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }
}