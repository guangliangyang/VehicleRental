namespace FleetService.Api.Authorization;

/// <summary>
/// Application role names that match Azure Entra ID Application Roles
/// </summary>
public static class Roles
{
    /// <summary>
    /// Regular user role - can rent and return vehicles
    /// </summary>
    public const string User = "User";

    /// <summary>
    /// Technician role - can manage vehicle maintenance status
    /// </summary>
    public const string Technician = "Technician";
}