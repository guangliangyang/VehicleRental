using System.Security.Claims;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Api.Services;

/// <summary>
/// Service for extracting user context from JWT claims in HTTP requests
/// </summary>
public sealed class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    public Result<string> GetUserId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
        {
            return Result<string>.Failure(new Error("User.NotAuthenticated", "User is not authenticated"));
        }

        // Try different claim types for user ID (Azure AD uses different claim names)
        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst("oid")?.Value
                    ?? httpContext.User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result<string>.Failure(new Error("User.IdNotFound", "User ID not found in token claims"));
        }

        return Result<string>.Success(userId);
    }

    public Result<string> GetUserEmail()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
        {
            return Result<string>.Failure(new Error("User.NotAuthenticated", "User is not authenticated"));
        }

        var email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value
                   ?? httpContext.User.FindFirst("preferred_username")?.Value
                   ?? httpContext.User.FindFirst("upn")?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Result<string>.Failure(new Error("User.EmailNotFound", "User email not found in token claims"));
        }

        return Result<string>.Success(email);
    }

    public Result<string> GetUserName()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
        {
            return Result<string>.Failure(new Error("User.NotAuthenticated", "User is not authenticated"));
        }

        var name = httpContext.User.FindFirst(ClaimTypes.Name)?.Value
                  ?? httpContext.User.FindFirst("name")?.Value
                  ?? httpContext.User.FindFirst(ClaimTypes.GivenName)?.Value;

        if (string.IsNullOrWhiteSpace(name))
        {
            return Result<string>.Failure(new Error("User.NameNotFound", "User name not found in token claims"));
        }

        return Result<string>.Success(name);
    }

    public bool IsAuthenticated()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        return httpContext?.User?.Identity?.IsAuthenticated == true;
    }
}