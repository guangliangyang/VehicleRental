using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Infrastructure.Repositories;
using FleetService.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace FleetService.Api.Extensions;

public static class InfrastructureServiceExtensions
{
    /// <summary>
    /// Configures Cosmos DB services and repository using Key Vault
    /// </summary>
    public static IServiceCollection AddCosmosServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Cosmos options from configuration (Key Vault URL)
        services.Configure<CosmosOptions>(options =>
        {
            options.KeyVaultUrl = configuration["Cosmos:KeyVaultUrl"] ?? throw new InvalidOperationException("Cosmos:KeyVaultUrl configuration is required");
        });

        // Register Key Vault service
        services.AddSingleton<IKeyVaultService>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<CosmosOptions>>().Value;
            var logger = sp.GetRequiredService<ILogger<KeyVaultService>>();
            return new KeyVaultService(options.KeyVaultUrl, logger);
        });

        // Register Cosmos repository factory
        services.AddSingleton<IVehicleRepository>(sp =>
        {
            var dispatcher = sp.GetRequiredService<IDomainEventDispatcher>();
            var keyVaultService = sp.GetRequiredService<IKeyVaultService>();
            var logger = sp.GetRequiredService<ILogger<CosmosVehicleRepository>>();

            // Create a lazy-initialized repository that loads secrets on first access
            return new LazyCosmosVehicleRepository(keyVaultService, dispatcher, logger);
        });

        return services;
    }
}