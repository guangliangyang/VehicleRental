using FleetService.Api.Configuration;
using Microsoft.Extensions.Options;
using Xunit;

namespace FleetService.UnitTests.Api.Configuration;

public class ValidateAzureAdOptionsTests
{
    private readonly ValidateAzureAdOptions _validator = new();

    [Fact]
    public void Validate_ShouldReturnSuccess_WhenAllOptionsValid()
    {
        // Positive test case: valid configuration
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://59f2f452-fcb5-4297-b702-f06230f75c63"
        };

        var result = _validator.Validate(null, options);

        Assert.True(result.Succeeded);
        Assert.Empty(result.Failures);
    }

    [Fact]
    public void Validate_ShouldReturnSuccess_WhenInstanceIsHttp()
    {
        // Edge case: HTTP instance for development
        var options = new AzureAdOptions
        {
            Instance = "http://localhost:8080/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://59f2f452-fcb5-4297-b702-f06230f75c63"
        };

        var result = _validator.Validate(null, options);

        Assert.True(result.Succeeded);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_ShouldFail_WhenInstanceEmpty(string? instance)
    {
        // Negative test case: empty instance
        var options = new AzureAdOptions
        {
            Instance = instance ?? string.Empty,
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:Instance is required", result.Failures);
    }

    [Theory]
    [InlineData("not-a-url")]
    [InlineData("ftp://invalid-scheme.com")]
    [InlineData("invalid-url")]
    public void Validate_ShouldFail_WhenInstanceInvalidUrl(string instance)
    {
        // Negative test case: invalid URL format
        var options = new AzureAdOptions
        {
            Instance = instance,
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:Instance must be a valid HTTP/HTTPS URL", result.Failures);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_ShouldFail_WhenTenantIdEmpty(string? tenantId)
    {
        // Negative test case: empty tenant ID
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = tenantId ?? string.Empty,
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:TenantId is required", result.Failures);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("invalid-guid-format")]
    public void Validate_ShouldFail_WhenTenantIdInvalidGuid(string tenantId)
    {
        // Negative test case: invalid GUID format
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = tenantId,
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:TenantId must be a valid GUID", result.Failures);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_ShouldFail_WhenClientIdEmpty(string? clientId)
    {
        // Negative test case: empty client ID
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = clientId ?? string.Empty,
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:ClientId is required", result.Failures);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("invalid-guid-format")]
    public void Validate_ShouldFail_WhenClientIdInvalidGuid(string clientId)
    {
        // Negative test case: invalid GUID format
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = clientId,
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:ClientId must be a valid GUID", result.Failures);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_ShouldFail_WhenAudienceEmpty(string? audience)
    {
        // Negative test case: empty audience
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = audience ?? string.Empty
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:Audience is required", result.Failures);
    }

    [Fact]
    public void Validate_ShouldReturnMultipleErrors_WhenMultipleFieldsInvalid()
    {
        // Negative test case: multiple validation errors
        var options = new AzureAdOptions
        {
            Instance = "",
            TenantId = "invalid-guid",
            ClientId = "",
            Audience = ""
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:Instance is required", result.Failures);
        Assert.Contains("AzureAd:TenantId must be a valid GUID", result.Failures);
        Assert.Contains("AzureAd:ClientId is required", result.Failures);
        Assert.Contains("AzureAd:Audience is required", result.Failures);
        Assert.Equal(4, result.Failures.Count());
    }

    [Fact]
    public void Validate_ShouldAcceptValidGuidFormats()
    {
        // Edge case: different valid GUID formats
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "{282eb06d-3a65-48c3-81c3-225d1e9a10f8}",  // With braces
            ClientId = "59F2F452-FCB5-4297-B702-F06230F75C63",     // Uppercase
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_ShouldHandleCommonTenantId()
    {
        // Edge case: 'common' tenant ID should fail GUID validation
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "common",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.False(result.Succeeded);
        Assert.Contains("AzureAd:TenantId must be a valid GUID", result.Failures);
    }

    [Fact]
    public void Validate_ShouldHandleNullName()
    {
        // Edge case: null name parameter
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate(null, options);

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_ShouldHandleNamedInstance()
    {
        // Edge case: named instance
        var options = new AzureAdOptions
        {
            Instance = "https://login.microsoftonline.com/",
            TenantId = "282eb06d-3a65-48c3-81c3-225d1e9a10f8",
            ClientId = "59f2f452-fcb5-4297-b702-f06230f75c63",
            Audience = "api://test"
        };

        var result = _validator.Validate("CustomName", options);

        Assert.True(result.Succeeded);
    }
}