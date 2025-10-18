using System.Linq;
using FleetService.Application;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Infrastructure.Repositories;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.UnitTests;

public class VehicleQueryServiceTests
{
    private readonly InMemoryVehicleRepository _repository;
    private readonly VehicleQueryService _service;

    public VehicleQueryServiceTests()
    {
        _repository = new InMemoryVehicleRepository(new NoOpDispatcher());
        _service = new VehicleQueryService(_repository);
    }

    [Fact]
    public async Task GetNearbyVehiclesAsync_ShouldReturnVehiclesWithinRadius()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        Assert.True(locationResult.IsSuccess);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var query = new NearbyVehiclesQuery(47.6062, -122.3321, 2);
        var result = await _service.GetNearbyVehiclesAsync(query);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value!);
        Assert.Equal(vehicle.Id, result.Value!.First().VehicleId);
    }

    [Fact]
    public async Task GetNearbyVehiclesAsync_ShouldFailWhenRadiusNegative()
    {
        var query = new NearbyVehiclesQuery(47.6062, -122.3321, -1);
        var result = await _service.GetNearbyVehiclesAsync(query);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidRadius", result.Error?.Code);
    }

    [Fact]
    public async Task GetNearbyVehiclesAsync_ShouldFailWhenCoordinatesInvalid()
    {
        var query = new NearbyVehiclesQuery(200, 10, 1);
        var result = await _service.GetNearbyVehiclesAsync(query);

        Assert.True(result.IsFailure);
        Assert.Equal("Location.InvalidLatitude", result.Error?.Code);
    }
}

internal sealed class NoOpDispatcher : IDomainEventDispatcher
{
    public Task DispatchAsync(IEnumerable<IDomainEvent> domainEvents, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
