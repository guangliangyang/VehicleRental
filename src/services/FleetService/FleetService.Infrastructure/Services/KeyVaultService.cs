using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using FleetService.Application.Configuration;
using Microsoft.Extensions.Logging;

namespace FleetService.Infrastructure.Services;

public sealed class KeyVaultService : IKeyVaultService
{
    private readonly SecretClient _secretClient;
    private readonly ILogger<KeyVaultService> _logger;

    public KeyVaultService(string keyVaultUrl, ILogger<KeyVaultService> logger)
    {
        _logger = logger;
        _secretClient = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
    }

    public async Task<string> GetSecretAsync(string secretName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving secret {SecretName} from Key Vault", secretName);
            var response = await _secretClient.GetSecretAsync(secretName, cancellationToken: cancellationToken);
            return response.Value.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve secret {SecretName} from Key Vault", secretName);
            throw;
        }
    }
}