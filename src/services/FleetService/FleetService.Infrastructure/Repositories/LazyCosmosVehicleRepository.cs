using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FleetService.Infrastructure.Repositories;

public sealed class LazyCosmosVehicleRepository : IVehicleRepository
{
    private readonly IKeyVaultService _keyVaultService;
    private readonly IDomainEventDispatcher _dispatcher;
    private readonly ILogger<CosmosVehicleRepository> _logger;
    private readonly Lazy<Task<CosmosVehicleRepository>> _lazyRepository;

    public LazyCosmosVehicleRepository(
        IKeyVaultService keyVaultService,
        IDomainEventDispatcher dispatcher,
        ILogger<CosmosVehicleRepository> logger)
    {
        _keyVaultService = keyVaultService;
        _dispatcher = dispatcher;
        _logger = logger;
        _lazyRepository = new Lazy<Task<CosmosVehicleRepository>>(InitializeRepositoryAsync);
    }

    private async Task<CosmosVehicleRepository> InitializeRepositoryAsync()
    {
        _logger.LogInformation("Initializing Cosmos DB repository with Key Vault secrets");

        // Retrieve secrets from Key Vault
        var endpoint = await _keyVaultService.GetSecretAsync("cosmos-endpoint");
        var key = await _keyVaultService.GetSecretAsync("cosmos-key");
        var databaseId = await _keyVaultService.GetSecretAsync("cosmos-database-id");
        var containerId = await _keyVaultService.GetSecretAsync("cosmos-container-id");

        // Create options with retrieved values
        var options = Options.Create(new CosmosOptions
        {
            Endpoint = endpoint,
            Key = key,
            DatabaseId = databaseId,
            ContainerId = containerId
        });

        var cosmosClient = new CosmosClient(endpoint, key);
        return new CosmosVehicleRepository(cosmosClient, options, _dispatcher, _logger);
    }

    public async Task<IReadOnlyList<Vehicle>> GetNearbyAsync(Location center, double radiusKilometers, CancellationToken cancellationToken)
    {
        var repository = await _lazyRepository.Value;
        return await repository.GetNearbyAsync(center, radiusKilometers, cancellationToken);
    }

    public async Task<Vehicle?> GetByIdAsync(string vehicleId, CancellationToken cancellationToken)
    {
        var repository = await _lazyRepository.Value;
        return await repository.GetByIdAsync(vehicleId, cancellationToken);
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        var repository = await _lazyRepository.Value;
        await repository.SaveAsync(vehicle, cancellationToken);
    }
}