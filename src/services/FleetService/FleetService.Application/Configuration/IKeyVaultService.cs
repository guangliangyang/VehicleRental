namespace FleetService.Application.Configuration;

public interface IKeyVaultService
{
    Task<string> GetSecretAsync(string secretName, CancellationToken cancellationToken = default);
}