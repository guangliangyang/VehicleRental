using FleetService.Api.Services;
using FleetService.Application;
using FleetService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FleetService.Api.Extensions;

public static class WebApplicationExtensions
{
    /// <summary>
    /// Configures middleware pipeline for development and production environments
    /// </summary>
    public static WebApplication ConfigureMiddleware(this WebApplication app)
    {
        // Enable CORS
        app.UseCors("AllowFrontend");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Authentication and Authorization middleware
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }

    /// <summary>
    /// Maps vehicle-related API endpoints
    /// </summary>
    public static WebApplication MapVehicleEndpoints(this WebApplication app)
    {
        app.MapGet("/vehicles/nearby", GetNearbyVehicles)
            .WithName("GetNearbyVehicles")
            .WithOpenApi()
            .RequireAuthorization();

        app.MapPut("/vehicles/{vehicleId}/status", UpdateVehicleStatus)
            .WithName("UpdateVehicleStatus")
            .WithOpenApi()
            .RequireAuthorization();

        // User-specific vehicle endpoints
        app.MapGet("/vehicles/user", GetUserVehicles)
            .WithName("GetUserVehicles")
            .WithOpenApi()
            .RequireAuthorization();

        app.MapPost("/vehicles/{vehicleId}/rent", RentVehicle)
            .WithName("RentVehicle")
            .WithOpenApi()
            .RequireAuthorization();

        app.MapPost("/vehicles/{vehicleId}/return", ReturnVehicle)
            .WithName("ReturnVehicle")
            .WithOpenApi()
            .RequireAuthorization();

        // Health check endpoint for Docker/Kubernetes (no auth required)
        app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
            .WithName("HealthCheck")
            .WithOpenApi();

        return app;
    }



    /// <summary>
    /// Initializes required services on startup
    /// </summary>
    public static async Task<WebApplication> InitializeServicesAsync(this WebApplication app)
    {
        // Azure resources are assumed to be created via IaC (Terraform/ARM)
        // No runtime initialization needed
        await Task.CompletedTask;
        return app;
    }

    /// <summary>
    /// Gets nearby vehicles within specified radius
    /// </summary>
    private static async Task<Results<Ok<IReadOnlyList<VehicleSummaryDto>>, BadRequest<ApiError>, UnauthorizedHttpResult>> GetNearbyVehicles(
        double latitude,
        double longitude,
        double? radius,
        IVehicleQueryService queryService,
        IUserContextService userContextService)
    {
        var userIdResult = userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return TypedResults.Unauthorized();
        }

        var query = new NearbyVehiclesQuery(latitude, longitude, radius.GetValueOrDefault(5));
        var result = await queryService.GetNearbyVehiclesAsync(query);

        return result.IsSuccess && result.Value is not null
            ? TypedResults.Ok(result.Value)
            : TypedResults.BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Updates vehicle status with optimistic concurrency control
    /// </summary>
    private static async Task<Results<Ok<ApiSuccess>, BadRequest<ApiError>, Conflict<ConcurrencyConflictError>, UnauthorizedHttpResult>> UpdateVehicleStatus(
        string vehicleId,
        UpdateVehicleStatusRequest request,
        IVehicleCommandService commandService,
        IUserContextService userContextService)
    {
        var userIdResult = userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return TypedResults.Unauthorized();
        }

        var result = await commandService.UpdateVehicleStatusAsync(vehicleId, request.ExpectedCurrentStatus, request.NewStatus);

        if (result.IsSuccess)
        {
            return TypedResults.Ok(new ApiSuccess("Vehicle status updated successfully"));
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

            return TypedResults.Conflict(new ConcurrencyConflictError(
                result.Error.Value.Code,
                result.Error.Value.Message,
                request.ExpectedCurrentStatus,
                request.NewStatus,
                actualCurrentStatus
            ));
        }

        return TypedResults.BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Gets vehicles rented by the current user
    /// </summary>
    private static async Task<Results<Ok<IReadOnlyList<VehicleSummaryDto>>, BadRequest<ApiError>, UnauthorizedHttpResult>> GetUserVehicles(
        IVehicleQueryService queryService,
        IUserContextService userContextService)
    {
        var userIdResult = userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return TypedResults.Unauthorized();
        }

        var result = await queryService.GetUserVehiclesAsync(userIdResult.Value!);

        return result.IsSuccess && result.Value is not null
            ? TypedResults.Ok(result.Value)
            : TypedResults.BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Rents a vehicle for the current user
    /// </summary>
    private static async Task<Results<Ok<ApiSuccess>, BadRequest<ApiError>, UnauthorizedHttpResult>> RentVehicle(
        string vehicleId,
        IVehicleCommandService commandService,
        IUserContextService userContextService)
    {
        var userIdResult = userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return TypedResults.Unauthorized();
        }

        var result = await commandService.RentVehicleAsync(vehicleId, userIdResult.Value!);

        return result.IsSuccess
            ? TypedResults.Ok(new ApiSuccess($"Vehicle {vehicleId} rented successfully"))
            : TypedResults.BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

    /// <summary>
    /// Returns a vehicle from the current user
    /// </summary>
    private static async Task<Results<Ok<ApiSuccess>, BadRequest<ApiError>, UnauthorizedHttpResult>> ReturnVehicle(
        string vehicleId,
        IVehicleCommandService commandService,
        IUserContextService userContextService)
    {
        var userIdResult = userContextService.GetUserId();
        if (userIdResult.IsFailure)
        {
            return TypedResults.Unauthorized();
        }

        var result = await commandService.ReturnVehicleAsync(vehicleId, userIdResult.Value!);

        return result.IsSuccess
            ? TypedResults.Ok(new ApiSuccess($"Vehicle {vehicleId} returned successfully"))
            : TypedResults.BadRequest(new ApiError(result.Error?.Code ?? "Unknown", result.Error?.Message ?? "Unknown error."));
    }

}

/// <summary>
/// Represents an API error response
/// </summary>
public sealed record ApiError(string Code, string Message);

/// <summary>
/// Represents an API success response
/// </summary>
public sealed record ApiSuccess(string Message);

/// <summary>
/// Request model for updating vehicle status with optimistic concurrency control
/// </summary>
public sealed record UpdateVehicleStatusRequest(VehicleStatus ExpectedCurrentStatus, VehicleStatus NewStatus);

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