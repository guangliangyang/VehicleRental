using FleetService.Api.Authorization;
using FleetService.Api.Configuration;
using FleetService.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

namespace FleetService.Api.Extensions;

public static class ApiServiceExtensions
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
        services.AddAuthorization(options =>
        {
            // Policy for technician-only operations
            options.AddPolicy(PolicyNames.TechnicianOnly, policy =>
                policy.RequireRole(Roles.Technician));

            // Policy for authenticated users (both regular users and technicians)
            options.AddPolicy(PolicyNames.AuthenticatedUser, policy =>
                policy.RequireRole(Roles.User, Roles.Technician));
        });

        return services;
    }

    /// <summary>
    /// Configures user context services
    /// </summary>
    private static IServiceCollection AddUserContextServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IUserContextService, UserContextService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IVehicleStatusValidator, VehicleStatusValidator>();

        return services;
    }
}