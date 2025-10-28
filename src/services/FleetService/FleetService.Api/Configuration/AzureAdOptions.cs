using System.ComponentModel.DataAnnotations;

namespace FleetService.Api.Configuration;

/// <summary>
/// Configuration options for Azure AD authentication
/// </summary>
public sealed class AzureAdOptions
{
    public const string SectionName = "AzureAd";

    /// <summary>
    /// Azure AD instance URL (e.g., https://login.microsoftonline.com/)
    /// </summary>
    [Required]
    public string Instance { get; init; } = string.Empty;

    /// <summary>
    /// Azure AD tenant ID
    /// </summary>
    [Required]
    public string TenantId { get; init; } = string.Empty;

    /// <summary>
    /// Azure AD client ID (Application ID)
    /// </summary>
    [Required]
    public string ClientId { get; init; } = string.Empty;

    /// <summary>
    /// JWT audience for token validation
    /// </summary>
    [Required]
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// Authority URL constructed from Instance and TenantId
    /// </summary>
    public string Authority => $"{Instance.TrimEnd('/')}/{TenantId}";

    /// <summary>
    /// Validates the configuration
    /// </summary>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(Instance) &&
               !string.IsNullOrWhiteSpace(TenantId) &&
               !string.IsNullOrWhiteSpace(ClientId) &&
               !string.IsNullOrWhiteSpace(Audience);
    }
}