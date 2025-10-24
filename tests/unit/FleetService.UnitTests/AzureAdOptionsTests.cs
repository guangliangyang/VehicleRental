using FleetService.Api.Configuration;
using Xunit;

namespace FleetService.UnitTests;

public class AzureAdOptionsTests
{
    [Fact]
    public void Authority_ShouldCombineInstanceAndTenantId_WhenBothProvided()
    {
        // Positive test case: valid authority construction
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8"
        };

        var authority = options.Authority;

        Assert.Equal("https://login.microsoftonline.com/282eb06d-3a65-48c3-81c3-225d1e9a10f8", authority);
    }

    [Fact]
    public void Authority_ShouldTrimTrailingSlash_WhenInstanceEndsWithSlash()
    {
        // Edge case: instance with multiple trailing slashes
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com///",
            TenantId = "test-tenant"
        };

        var authority = options.Authority;

        Assert.Equal("https://login.microsoftonline.com/test-tenant", authority);
    }

    [Fact]
    public void Authority_ShouldHandleInstanceWithoutTrailingSlash()
    {
        // Edge case: instance without trailing slash
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com",
            TenantId = "test-tenant"
        };

        var authority = options.Authority;

        Assert.Equal("https://login.microsoftonline.com/test-tenant", authority);
    }

    [Fact]
    public void IsValid_ShouldReturnTrue_WhenAllPropertiesProvided()
    {
        // Positive test case: valid configuration
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://59f2f452-fcb5-4297-b702-f06230f75c63"
        };

        var isValid = options.IsValid();

        Assert.True(isValid);
    }

    [Theory]
    [InlineData("", "tenant", "client", "audience")]
    [InlineData("instance", "", "client", "audience")]
    [InlineData("instance", "tenant", "", "audience")]
    [InlineData("instance", "tenant", "client", "")]
    public void IsValid_ShouldReturnFalse_WhenAnyPropertyEmpty(string instance, string tenantId, string clientId, string audience)
    {
        // Negative test case: missing required properties
        var options = new AzureAdOptions
        {
            Instance = instance,
            TenantId = tenantId,
            ClientId = clientId,
            Audience = audience
        };

        var isValid = options.IsValid();

        Assert.False(isValid);
    }

    [Theory]
    [InlineData(null, "tenant", "client", "audience")]
    [InlineData("instance", null, "client", "audience")]
    [InlineData("instance", "tenant", null, "audience")]
    [InlineData("instance", "tenant", "client", null)]
    public void IsValid_ShouldReturnFalse_WhenAnyPropertyNull(string? instance, string? tenantId, string? clientId, string? audience)
    {
        // Negative test case: null properties
        var options = new AzureAdOptions
        {
            Instance = instance ?? string.Empty,
            TenantId = tenantId ?? string.Empty,
            ClientId = clientId ?? string.Empty,
            Audience = audience ?? string.Empty
        };

        var isValid = options.IsValid();

        Assert.False(isValid);
    }

    [Theory]
    [InlineData("   ", "tenant", "client", "audience")]
    [InlineData("instance", "   ", "client", "audience")]
    [InlineData("instance", "tenant", "   ", "audience")]
    [InlineData("instance", "tenant", "client", "   ")]
    public void IsValid_ShouldReturnFalse_WhenAnyPropertyWhitespace(string instance, string tenantId, string clientId, string audience)
    {
        // Edge case: whitespace-only properties
        var options = new AzureAdOptions
        {
            Instance = instance,
            TenantId = tenantId,
            ClientId = clientId,
            Audience = audience
        };

        var isValid = options.IsValid();

        Assert.False(isValid);
    }

    [Fact]
    public void SectionName_ShouldBeAzureAd()
    {
        // Positive test case: correct section name
        Assert.Equal("AzureAd", AzureAdOptions.SectionName);
    }

    [Fact]
    public void DefaultConstructor_ShouldInitializeWithEmptyStrings()
    {
        // Positive test case: default initialization
        var options = new AzureAdOptions();

        Assert.Equal(string.Empty, options.Instance);
        Assert.Equal(string.Empty, options.TenantId);
        Assert.Equal(string.Empty, options.ClientId);
        Assert.Equal(string.Empty, options.Audience);
        Assert.False(options.IsValid());
    }

    [Fact]
    public void Authority_ShouldHandleEmptyValues_Gracefully()
    {
        // Edge case: empty values
        var options = new AzureAdOptions
        {
            Instance = "",
            TenantId = ""
        };

        var authority = options.Authority;

        Assert.Equal("/", authority);
    }

    [Fact]
    public void Authority_ShouldHandleSpecialCharacters_InTenantId()
    {
        // Edge case: special characters in tenant ID
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "common"
        };

        var authority = options.Authority;

        Assert.Equal("https://login.microsoftonline.com/common", authority);
    }
}