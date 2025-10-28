namespace FleetService.Api.Authorization;

/// <summary>
/// Authorization policy names for role-based access control
/// </summary>
public static class PolicyNames
{
    /// <summary>
    /// Policy for technician-only operations (vehicle maintenance management)
    /// </summary>
    public const string TechnicianOnly = "TechnicianOnly";

    /// <summary>
    /// Policy for authenticated users (both regular users and technicians)
    /// </summary>
    public const string AuthenticatedUser = "AuthenticatedUser";
}