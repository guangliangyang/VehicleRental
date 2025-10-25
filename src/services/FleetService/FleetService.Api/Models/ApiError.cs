namespace FleetService.Api.Models;

/// <summary>
/// Represents an API error response
/// </summary>
public sealed record ApiError(string Code, string Message);