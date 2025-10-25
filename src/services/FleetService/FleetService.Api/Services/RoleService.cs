using FleetService.Api.Authorization;
using System.Security.Claims;

namespace FleetService.Api.Services;

/// <summary>
/// Service for role-based operations and authorization checks.
/// Works with Azure Entra ID Application Roles in JWT tokens.
/// </summary>
public sealed class RoleService : IRoleService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RoleService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    public IEnumerable<string> GetUserRoles()
    {
        var httpContext = _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("HTTP context is not available");

        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            return Enumerable.Empty<string>();
        }

        // Azure Entra ID includes roles in both 'roles' claim and ClaimTypes.Role
        var roleClaims = httpContext.User.Claims
            .Where(c => c.Type == ClaimTypes.Role || c.Type == "roles")
            .Select(c => c.Value)
            .Distinct()
            .ToList();

        return roleClaims;
    }

    public bool HasRole(string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        return GetUserRoles().Contains(roleName, StringComparer.OrdinalIgnoreCase);
    }

    public bool IsTechnician()
    {
        return HasRole(Roles.Technician);
    }

    public bool IsUser()
    {
        return HasRole(Roles.User);
    }
}