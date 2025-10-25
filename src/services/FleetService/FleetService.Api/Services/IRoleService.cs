namespace FleetService.Api.Services;

/// <summary>
/// Service for role-based operations and authorization checks
/// </summary>
public interface IRoleService
{
    /// <summary>
    /// Gets all roles assigned to the current user
    /// </summary>
    /// <returns>Collection of role names</returns>
    IEnumerable<string> GetUserRoles();

    /// <summary>
    /// Checks if the current user has the specified role
    /// </summary>
    /// <param name="roleName">Name of the role to check</param>
    /// <returns>True if user has the role, false otherwise</returns>
    bool HasRole(string roleName);

    /// <summary>
    /// Checks if the current user is a technician
    /// </summary>
    /// <returns>True if user is a technician, false otherwise</returns>
    bool IsTechnician();

    /// <summary>
    /// Checks if the current user is a regular user
    /// </summary>
    /// <returns>True if user is a regular user, false otherwise</returns>
    bool IsUser();
}