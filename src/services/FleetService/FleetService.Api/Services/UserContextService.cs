using System.Security.Claims;

namespace FleetService.Api.Services;

/// <summary>
/// Service for extracting user context from JWT claims in HTTP requests.
/// Assumes user is already authenticated via [Authorize] attribute.
/// </summary>
public sealed class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    public string GetUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("HTTP context is not available");

        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Try different claim types for user ID (Azure AD uses different claim names)
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst("oid")?.Value
                    ?? httpContext.User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new InvalidOperationException("User ID not found in token claims");
        }

        return userId;
    }

    public string GetUserEmail()
    {
        var httpContext = _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("HTTP context is not available");

        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value
                   ?? httpContext.User.FindFirst("preferred_username")?.Value
                   ?? httpContext.User.FindFirst("upn")?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("User email not found in token claims");
        }

        return email;
    }

    public string GetUserName()
    {
        var httpContext = _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("HTTP context is not available");

        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        var name = httpContext.User.FindFirst(ClaimTypes.Name)?.Value
                  ?? httpContext.User.FindFirst("name")?.Value
                  ?? httpContext.User.FindFirst(ClaimTypes.GivenName)?.Value;

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("User name not found in token claims");
        }

        return name;
    }

    public bool IsAuthenticated()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        return httpContext?.User?.Identity?.IsAuthenticated == true;
    }
}