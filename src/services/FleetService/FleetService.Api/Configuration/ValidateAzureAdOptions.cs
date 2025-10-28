using Microsoft.Extensions.Options;

namespace FleetService.Api.Configuration;

/// <summary>
/// Validates Azure AD configuration options
/// </summary>
public sealed class ValidateAzureAdOptions : IValidateOptions<AzureAdOptions>
{
    public ValidateOptionsResult Validate(string? name, AzureAdOptions options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Instance))
        {
            errors.Add("AzureAd:Instance is required");
        }
        else if (!Uri.TryCreate(options.Instance, UriKind.Absolute, out var instanceUri) ||
                 (instanceUri.Scheme != "https" && instanceUri.Scheme != "http"))
        {
            errors.Add("AzureAd:Instance must be a valid HTTP/HTTPS URL");
        }

        if (string.IsNullOrWhiteSpace(options.TenantId))
        {
            errors.Add("AzureAd:TenantId is required");
        }
        else if (!Guid.TryParse(options.TenantId, out _))
        {
            errors.Add("AzureAd:TenantId must be a valid GUID");
        }

        if (string.IsNullOrWhiteSpace(options.ClientId))
        {
            errors.Add("AzureAd:ClientId is required");
        }
        else if (!Guid.TryParse(options.ClientId, out _))
        {
            errors.Add("AzureAd:ClientId must be a valid GUID");
        }

        if (string.IsNullOrWhiteSpace(options.Audience))
        {
            errors.Add("AzureAd:Audience is required");
        }

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}