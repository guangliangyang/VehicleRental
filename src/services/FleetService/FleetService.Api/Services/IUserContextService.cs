namespace FleetService.Api.Services;

/// <summary>
/// Service for extracting user context from JWT claims.
/// Note: This service assumes the user is already authenticated via [Authorize] attribute.
/// </summary>
public interface IUserContextService
{
    /// <summary>
    /// Gets the current user's ID from JWT claims.
    /// Throws exception if user is not authenticated (should not happen under [Authorize]).
    /// </summary>
    /// <returns>User ID from claims</returns>
    string GetUserId();

    /// <summary>
    /// Gets the current user's email from JWT claims.
    /// Throws exception if user is not authenticated (should not happen under [Authorize]).
    /// </summary>
    /// <returns>User email from claims</returns>
    string GetUserEmail();

    /// <summary>
    /// Gets the current user's display name from JWT claims.
    /// Throws exception if user is not authenticated (should not happen under [Authorize]).
    /// </summary>
    /// <returns>User name from claims</returns>
    string GetUserName();

    /// <summary>
    /// Checks if the current request is authenticated.
    /// </summary>
    /// <returns>True if authenticated, false otherwise</returns>
    bool IsAuthenticated();
}