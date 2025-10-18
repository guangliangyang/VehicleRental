using FleetService.Application;
using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Domain.Events;
using FleetService.Infrastructure.Events;
using FleetService.Infrastructure.Repositories;
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
    /// Configures Cosmos DB services and repository
    /// </summary>
    public static IServiceCollection AddCosmosServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Cosmos options from environment variables
        services.Configure<CosmosOptions>(options =>
        {
            options.Endpoint = Environment.GetEnvironmentVariable("COSMOS_ENDPOINT") ?? "";
            options.Key = Environment.GetEnvironmentVariable("COSMOS_KEY") ?? "";
            options.DatabaseId = Environment.GetEnvironmentVariable("COSMOS_DATABASE_ID") ?? "fleet";
            options.ContainerId = Environment.GetEnvironmentVariable("COSMOS_CONTAINER_ID") ?? "Vehicles";
        });

        services.AddSingleton<IVehicleRepository>(sp =>
        {
            var dispatcher = sp.GetRequiredService<IDomainEventDispatcher>();
            var options = sp.GetRequiredService<IOptions<CosmosOptions>>().Value;

            if (string.IsNullOrWhiteSpace(options.Endpoint) || string.IsNullOrWhiteSpace(options.Key))
            {
                throw new InvalidOperationException("Cosmos DB configuration is required. Please set COSMOS_ENDPOINT and COSMOS_KEY environment variables");
            }

            var cosmosClient = new CosmosClient(options.Endpoint, options.Key);
            var logger = sp.GetRequiredService<ILogger<CosmosVehicleRepository>>();
            return new CosmosVehicleRepository(cosmosClient, sp.GetRequiredService<IOptions<CosmosOptions>>(), dispatcher, logger);
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