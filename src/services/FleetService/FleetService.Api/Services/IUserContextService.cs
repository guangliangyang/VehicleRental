using VehicleRentalSystem.SharedKernel;

namespace FleetService.Api.Services;

/// <summary>
/// Service for extracting user context from JWT claims
/// </summary>
public interface IUserContextService
{
    /// <summary>
    /// Gets the current user's ID from JWT claims
    /// </summary>
    /// <returns>User ID if found, otherwise failure result</returns>
    Result<string> GetUserId();

    /// <summary>
    /// Gets the current user's email from JWT claims
    /// </summary>
    /// <returns>User email if found, otherwise failure result</returns>
    Result<string> GetUserEmail();

    /// <summary>
    /// Gets the current user's display name from JWT claims
    /// </summary>
    /// <returns>User name if found, otherwise failure result</returns>
    Result<string> GetUserName();

    /// <summary>
    /// Checks if the current request is authenticated
    /// </summary>
    /// <returns>True if authenticated, false otherwise</returns>
    bool IsAuthenticated();
}