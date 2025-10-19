using System.Net.Http.Json;
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using FleetService.Api;
using FleetService.Domain;
using Xunit;

namespace FleetService.IntegrationTests;

public class VehicleApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public VehicleApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetVehiclesNearby_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/vehicles/nearby?latitude=40.7128&longitude=-74.0060&radius=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        Assert.NotNull(content);
    }

    [Fact]
    public async Task GetVehiclesNearby_WithInvalidCoordinates_ShouldReturnBadRequest()
    {
        var response = await _client.GetAsync("/vehicles/nearby?latitude=200&longitude=-200&radius=10");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task HealthCheck_ShouldReturnHealthy()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
    }
}