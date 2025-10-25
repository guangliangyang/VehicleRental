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
using System.IdentityModel.Tokens.Jwt;

namespace FleetService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Configures API-related services including Swagger, CORS, and Authentication
    /// </summary>
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        // Configure and validate Azure AD options
        services.Configure<AzureAdOptions>(configuration.GetSection(AzureAdOptions.SectionName));
        services.AddSingleton<IValidateOptions<AzureAdOptions>, ValidateAzureAdOptions>();

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
                .AllowAnyMethod()
                .AllowCredentials();
            });
        });

        // Configure JWT Authentication with Azure AD
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(configuration.GetSection(AzureAdOptions.SectionName))
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddInMemoryTokenCaches();

        // Add custom JWT logging for debugging
        services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var token = context.SecurityToken as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;

                    if (token != null)
                    {
                        logger.LogInformation("JWT Token validated successfully:");
                        logger.LogInformation("  Issuer: {Issuer}", token.Issuer);
                        logger.LogInformation("  Audience: {Audience}", string.Join(", ", token.Audiences));
                        logger.LogInformation("  Subject: {Subject}", token.Subject);
                        logger.LogInformation("  KeyId: {KeyId}", token.Header.Kid);
                        logger.LogInformation("  Claims: {Claims}",
                            string.Join(", ", token.Claims.Select(c => $"{c.Type}={c.Value}")));
                    }

                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogError(context.Exception, "JWT Authentication failed: {Error}", context.Exception.Message);

                    // Try to parse the token to see what's wrong
                    var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                    if (authHeader?.StartsWith("Bearer ") == true)
                    {
                        var tokenString = authHeader.Substring(7);
                        try
                        {
                            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                            var token = handler.ReadJwtToken(tokenString);

                            logger.LogError("Failed token details:");
                            logger.LogError("  Issuer: {Issuer}", token.Issuer);
                            logger.LogError("  Audience: {Audience}", string.Join(", ", token.Audiences));
                            logger.LogError("  Subject: {Subject}", token.Subject);
                            logger.LogError("  KeyId: {KeyId}", token.Header.Kid);
                            logger.LogError("  Expiry: {Expiry}", token.ValidTo);
                            logger.LogError("  Claims: {Claims}",
                                string.Join(", ", token.Claims.Select(c => $"{c.Type}={c.Value}")));
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Could not parse JWT token for debugging");
                        }
                    }

                    return Task.CompletedTask;
                }
            };
        });

        // Configure authorization policies (simplified for initial testing)
        services.AddAuthorization();

        // Register HTTP Context Accessor and User Context Service
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