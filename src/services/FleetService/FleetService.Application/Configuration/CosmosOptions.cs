namespace FleetService.Application.Configuration;

public sealed class CosmosOptions
{
    public string KeyVaultUrl { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string DatabaseId { get; set; } = "fleet";
    public string ContainerId { get; set; } = "Vehicles";
}
