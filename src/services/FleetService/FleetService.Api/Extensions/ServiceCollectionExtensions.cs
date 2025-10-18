using FleetService.Application;
using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Domain.Events;
using FleetService.Infrastructure.Events;
using FleetService.Infrastructure.Repositories;
using FleetService.Infrastructure.Services;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace FleetService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Configures API-related services including Swagger and CORS
    /// </summary>
    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        // Add CORS for frontend access
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                    "http://localhost:3000",                    // Local development
                    "https://*.azure-api.net",                  // API Management
                    "https://*.azurewebsites.net"               // Azure Web Apps
                )
                .SetIsOriginAllowedToAllowWildcardSubdomains()
                .AllowAnyHeader()
                .AllowAnyMethod();
            });
        });

        return services;
    }

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


    /// <summary>
    /// Configures domain services including event handling
    /// </summary>
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddSingleton<IDomainEventDispatcher, DomainEventDispatcher>();
        services.AddScoped<IDomainEventHandler<VehicleStatusChangedDomainEvent>, VehicleDomainEventHandler>();
        services.AddScoped<IDomainEventHandler<VehicleLocationUpdatedDomainEvent>, VehicleDomainEventHandler>();
        services.AddScoped<IVehicleQueryService, VehicleQueryService>();
        services.AddScoped<IVehicleCommandService, VehicleCommandService>();

        return services;
    }
}