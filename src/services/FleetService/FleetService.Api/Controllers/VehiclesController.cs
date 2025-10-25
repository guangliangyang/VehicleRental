using FleetService.Api.Models;
using FleetService.Api.Services;
using FleetService.Application;
using FleetService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FleetService.Api.Controllers;

[ApiController]
[Route("vehicles")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleQueryService _queryService;
    private readonly IVehicleCommandService _commandService;
    private readonly IUserContextService _userContextService;

    public VehiclesController(
        IVehicleQueryService queryService,
        IVehicleCommandService commandService,
        IUserContextService userContextService)
    {
        _queryService = queryService;
        _commandService = commandService;
        _userContextService = userContextService;
    }

    /// <summary>
    /// Gets nearby vehicles within specified radius
    /// </summary>
    [HttpGet("nearby")]
    public async Task<ActionResult<IReadOnlyList<VehicleSummaryDto>>> GetNearbyVehicles(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double? radius = 5)
    {
        var userIdResult = _userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return Unauthorized();
        }

        var query = new NearbyVehiclesQuery(latitude, longitude, radius.GetValueOrDefault(5));
        var result = await _queryService.GetNearbyVehiclesAsync(query);

        return result.IsSuccess && result.Value is not null
            ? Ok(result.Value)
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Updates vehicle status with optimistic concurrency control
    /// </summary>
    [HttpPut("{vehicleId}/status")]
    public async Task<ActionResult<ApiSuccess>> UpdateVehicleStatus(
        string vehicleId,
        [FromBody] UpdateVehicleStatusRequest request)
    {
        var userIdResult = _userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return Unauthorized();
        }

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
    /// Gets vehicles rented by the current user
    /// </summary>
    [HttpGet("user")]
    public async Task<ActionResult<IReadOnlyList<VehicleSummaryDto>>> GetUserVehicles()
    {
        var userIdResult = _userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return Unauthorized();
        }

        var result = await _queryService.GetUserVehiclesAsync(userIdResult.Value!);

        return result.IsSuccess && result.Value is not null
            ? Ok(result.Value)
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Rents a vehicle for the current user
    /// </summary>
    [HttpPost("{vehicleId}/rent")]
    public async Task<ActionResult<ApiSuccess>> RentVehicle(string vehicleId)
    {
        var userIdResult = _userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return Unauthorized();
        }

        var result = await _commandService.RentVehicleAsync(vehicleId, userIdResult.Value!);

        return result.IsSuccess
            ? Ok(new ApiSuccess($"Vehicle {vehicleId} rented successfully"))
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Returns a vehicle from the current user
    /// </summary>
    [HttpPost("{vehicleId}/return")]
    public async Task<ActionResult<ApiSuccess>> ReturnVehicle(string vehicleId)
    {
        var userIdResult = _userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return Unauthorized();
        }

        var result = await _commandService.ReturnVehicleAsync(vehicleId, userIdResult.Value!);

        return result.IsSuccess
            ? Ok(new ApiSuccess($"Vehicle {vehicleId} returned successfully"))
            : BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }
}