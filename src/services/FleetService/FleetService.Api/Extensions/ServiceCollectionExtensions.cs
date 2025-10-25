using FleetService.Api.Configuration;
using FleetService.Api.Services;
using FleetService.Application;
using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Domain.Events;
using FleetService.Infrastructure.Events;
using FleetService.Infrastructure.Repositories;
using FleetService.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FleetService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Configures all API-related services
    /// </summary>
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddWebApiServices();
        services.AddCorsServices();
        services.AddAuthenticationServices(configuration);
        services.AddUserContextServices();

        return services;
    }

    /// <summary>
    /// Configures Web API controllers and documentation
    /// </summary>
    private static IServiceCollection AddWebApiServices(this IServiceCollection services)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }

    /// <summary>
    /// Configures CORS policies for frontend access
    /// </summary>
    private static IServiceCollection AddCorsServices(this IServiceCollection services)
    {
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
                .AllowAnyMethod()
                .AllowCredentials();
            });
        });

        return services;
    }

    /// <summary>
    /// Configures Azure AD authentication and JWT handling
    /// </summary>
    private static IServiceCollection AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure and validate Azure AD options
        services.Configure<AzureAdOptions>(configuration.GetSection(AzureAdOptions.SectionName));
        services.AddSingleton<IValidateOptions<AzureAdOptions>, ValidateAzureAdOptions>();

        // Configure JWT Authentication with Azure AD
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(configuration.GetSection(AzureAdOptions.SectionName))
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddInMemoryTokenCaches();

        // Add custom JWT event handling for debugging
        services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.Events = JwtBearerEventsFactory.CreateEvents();
        });

        // Configure authorization policies
        services.AddAuthorization();

        return services;
    }

    /// <summary>
    /// Configures user context services
    /// </summary>
    private static IServiceCollection AddUserContextServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IUserContextService, UserContextService>();

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