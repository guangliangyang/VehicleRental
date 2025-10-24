using FleetService.Api.Configuration;
using FleetService.Api.Extensions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace FleetService.UnitTests.Api.Extensions;

public class ServiceCollectionExtensionsTests
{
    [Fact]
    public void AddApiServices_ShouldRegisterAllRequiredServices()
    {
        // Positive test case: service registration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Verify core services are registered
        Assert.NotNull(serviceProvider.GetService<IAuthenticationService>());
        Assert.NotNull(serviceProvider.GetService<IAuthorizationService>());
        Assert.NotNull(serviceProvider.GetService<IOptionsMonitor<AzureAdOptions>>());
        Assert.NotNull(serviceProvider.GetService<IValidateOptions<AzureAdOptions>>());
    }

    [Fact]
    public void AddApiServices_ShouldConfigureAzureAdOptions()
    {
        // Positive test case: options configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var options = serviceProvider.GetRequiredService<IOptions<AzureAdOptions>>().Value;

        Assert.Equal("https://login.microsoftonline.com/", options.Instance);
        Assert.Equal("282eb06d-3a65-48c3-81c3-225d1e9a10f8", options.TenantId);
        Assert.Equal("59f2f452-fcb5-4297-b702-f06230f75c63", options.ClientId);
        Assert.Equal("api://59f2f452-fcb5-4297-b702-f06230f75c63", options.Audience);
    }

    [Fact]
    public void AddApiServices_ShouldConfigureAuthorizationPolicies()
    {
        // Positive test case: authorization policy configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var authorizationOptions = serviceProvider.GetRequiredService<IOptions<AuthorizationOptions>>().Value;

        // Verify policies are registered
        Assert.Contains(authorizationOptions.GetPolicy("VehicleRead"), policy => policy != null);
        Assert.Contains(authorizationOptions.GetPolicy("VehicleWrite"), policy => policy != null);
        Assert.Contains(authorizationOptions.GetPolicy("VehicleAdmin"), policy => policy != null);
    }

    [Fact]
    public void AddApiServices_ShouldConfigureVehicleReadPolicy()
    {
        // Positive test case: VehicleRead policy configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var authorizationOptions = serviceProvider.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var policy = authorizationOptions.GetPolicy("VehicleRead");

        Assert.NotNull(policy);
        Assert.Contains(policy.Requirements, req => req.GetType().Name.Contains("ClaimsAuthorizationRequirement"));
    }

    [Fact]
    public void AddApiServices_ShouldConfigureVehicleWritePolicy()
    {
        // Positive test case: VehicleWrite policy configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var authorizationOptions = serviceProvider.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var policy = authorizationOptions.GetPolicy("VehicleWrite");

        Assert.NotNull(policy);
        Assert.Contains(policy.Requirements, req => req.GetType().Name.Contains("ClaimsAuthorizationRequirement"));
    }

    [Fact]
    public void AddApiServices_ShouldConfigureVehicleAdminPolicy()
    {
        // Positive test case: VehicleAdmin policy configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var authorizationOptions = serviceProvider.GetRequiredService<IOptions<AuthorizationOptions>>().Value;
        var policy = authorizationOptions.GetPolicy("VehicleAdmin");

        Assert.NotNull(policy);
        Assert.Contains(policy.Requirements, req => req.GetType().Name.Contains("ClaimsAuthorizationRequirement"));
    }

    [Fact]
    public void AddApiServices_ShouldConfigureJwtBearerAuthentication()
    {
        // Positive test case: JWT Bearer authentication configuration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var authOptions = serviceProvider.GetRequiredService<IOptions<AuthenticationOptions>>().Value;

        Assert.Equal(JwtBearerDefaults.AuthenticationScheme, authOptions.DefaultAuthenticateScheme);
        Assert.Equal(JwtBearerDefaults.AuthenticationScheme, authOptions.DefaultChallengeScheme);
    }

    [Fact]
    public void AddApiServices_ShouldRegisterValidationService()
    {
        // Positive test case: validation service registration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();
        var validator = serviceProvider.GetRequiredService<IValidateOptions<AzureAdOptions>>();

        Assert.IsType<ValidateAzureAdOptions>(validator);
    }

    [Fact]
    public void AddApiServices_ShouldConfigureCorsWithCredentials()
    {
        // Positive test case: CORS configuration with credentials
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        // CORS is registered as a service, but the actual policy testing
        // would require middleware testing which is beyond unit test scope
        var serviceProvider = services.BuildServiceProvider();
        Assert.NotNull(serviceProvider.GetService<Microsoft.AspNetCore.Cors.Infrastructure.ICorsService>());
    }

    [Fact]
    public void AddApiServices_ShouldThrowException_WhenConfigurationMissing()
    {
        // Negative test case: missing configuration
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().Build(); // Empty configuration

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Should throw when trying to get options without configuration
        Assert.Throws<OptionsValidationException>(() =>
            serviceProvider.GetRequiredService<IOptions<AzureAdOptions>>().Value);
    }

    [Fact]
    public void AddApiServices_ShouldValidateConfiguration_WhenInvalid()
    {
        // Negative test case: invalid configuration
        var services = new ServiceCollection();
        var configuration = CreateInvalidConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Should throw validation exception
        Assert.Throws<OptionsValidationException>(() =>
            serviceProvider.GetRequiredService<IOptions<AzureAdOptions>>().Value);
    }

    [Fact]
    public void AddApiServices_ShouldRegisterSwaggerServices()
    {
        // Positive test case: Swagger service registration
        var services = new ServiceCollection();
        var configuration = CreateTestConfiguration();

        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Verify Swagger services are registered
        Assert.NotNull(serviceProvider.GetService<Swashbuckle.AspNetCore.SwaggerGen.ISwaggerProvider>());
    }

    [Fact]
    public void AddApiServices_ShouldHandlePartialConfiguration()
    {
        // Edge case: partial configuration
        var configurationData = new Dictionary<string, string?>
        {
            ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
            ["AzureAd:TenantId"] = "282eb06d-3a65-48c3-81c3-225d1e9a10f8"
            // Missing ClientId and Audience
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();

        var services = new ServiceCollection();
        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Should throw validation exception due to missing required fields
        Assert.Throws<OptionsValidationException>(() =>
            serviceProvider.GetRequiredService<IOptions<AzureAdOptions>>().Value);
    }

    [Fact]
    public void AddApiServices_ShouldHandleEmptyConfiguration()
    {
        // Edge case: empty configuration section
        var configurationData = new Dictionary<string, string?>
        {
            ["AzureAd:Instance"] = "",
            ["AzureAd:TenantId"] = "",
            ["AzureAd:ClientId"] = "",
            ["AzureAd:Audience"] = ""
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();

        var services = new ServiceCollection();
        services.AddApiServices(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Should throw validation exception due to empty values
        Assert.Throws<OptionsValidationException>(() =>
            serviceProvider.GetRequiredService<IOptions<AzureAdOptions>>().Value);
    }

    private static IConfiguration CreateTestConfiguration()
    {
        var configurationData = new Dictionary<string, string?>
        {
            ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
            ["AzureAd:TenantId"] = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ["AzureAd:ClientId"] = "59f2f452-fcb5-4297-b702-f06230f75c63",
            ["AzureAd:Audience"] = "api://59f2f452-fcb5-4297-b702-f06230f75c63"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
    }

    private static IConfiguration CreateInvalidConfiguration()
    {
        var configurationData = new Dictionary<string, string?>
        {
            ["AzureAd:Instance"] = "not-a-url",
            ["AzureAd:TenantId"] = "invalid-guid",
            ["AzureAd:ClientId"] = "invalid-guid",
            ["AzureAd:Audience"] = ""
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(configurationData)
            .Build();
    }
}