using FleetService.Application;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Infrastructure.Repositories;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.UnitTests;

public class VehicleCommandServiceTests
{
    private readonly InMemoryVehicleRepository _repository;
    private readonly VehicleCommandService _service;

    public VehicleCommandServiceTests()
    {
        _repository = new InMemoryVehicleRepository(new NoOpDispatcher());
        _service = new VehicleCommandService(_repository);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldSucceed_WhenValidParameters()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var result = await _service.UpdateVehicleStatusAsync("VIN123456789", VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var updatedVehicle = await _repository.GetByIdAsync("VIN123456789", CancellationToken.None);
        Assert.Equal(VehicleStatus.Rented, updatedVehicle!.Status);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldFail_WhenVehicleIdIsEmpty()
    {
        var result = await _service.UpdateVehicleStatusAsync("", VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidId", result.Error?.Code);
        Assert.Equal("Vehicle ID is required.", result.Error?.Message);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldFail_WhenVehicleIdIsNull()
    {
        var result = await _service.UpdateVehicleStatusAsync(null!, VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidId", result.Error?.Code);
        Assert.Equal("Vehicle ID is required.", result.Error?.Message);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldFail_WhenVehicleNotFound()
    {
        var result = await _service.UpdateVehicleStatusAsync("NonExistentVIN", VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.NotFound", result.Error?.Code);
        Assert.Equal("Vehicle with ID 'NonExistentVIN' not found.", result.Error?.Message);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldFail_WhenConcurrencyConflict()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        vehicle.UpdateStatus(VehicleStatus.Rented);
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var result = await _service.UpdateVehicleStatusAsync("VIN123456789", VehicleStatus.Available, VehicleStatus.Maintenance, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.ConcurrencyConflict", result.Error?.Code);
        Assert.Contains("Expected: Available, Actual: Rented", result.Error?.Message);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldFail_WhenInvalidStatusTransition()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var result = await _service.UpdateVehicleStatusAsync("VIN123456789", VehicleStatus.Available, VehicleStatus.Unknown, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidStatus", result.Error?.Code);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldReturnSuccess_WhenStatusUnchanged()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var result = await _service.UpdateVehicleStatusAsync("VIN123456789", VehicleStatus.Available, VehicleStatus.Available, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var updatedVehicle = await _repository.GetByIdAsync("VIN123456789", CancellationToken.None);
        Assert.Equal(VehicleStatus.Available, updatedVehicle!.Status);
    }

    [Theory]
    [InlineData(VehicleStatus.Available, VehicleStatus.Rented)]
    [InlineData(VehicleStatus.Rented, VehicleStatus.Available)]
    [InlineData(VehicleStatus.Available, VehicleStatus.Maintenance)]
    [InlineData(VehicleStatus.Maintenance, VehicleStatus.Available)]
    [InlineData(VehicleStatus.Available, VehicleStatus.OutOfService)]
    [InlineData(VehicleStatus.OutOfService, VehicleStatus.Available)]
    public async Task UpdateVehicleStatusAsync_ShouldSucceed_ForValidStatusTransitions(VehicleStatus currentStatus, VehicleStatus newStatus)
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, currentStatus).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        var result = await _service.UpdateVehicleStatusAsync("VIN123456789", currentStatus, newStatus, CancellationToken.None);

        Assert.True(result.IsSuccess);
        var updatedVehicle = await _repository.GetByIdAsync("VIN123456789", CancellationToken.None);
        Assert.Equal(newStatus, updatedVehicle!.Status);
    }

    [Fact]
    public async Task UpdateVehicleStatusAsync_ShouldPreserveVehicleLocation()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;
        await _repository.SaveAsync(vehicle, CancellationToken.None);

        await _service.UpdateVehicleStatusAsync("VIN123456789", VehicleStatus.Available, VehicleStatus.Rented, CancellationToken.None);

        var updatedVehicle = await _repository.GetByIdAsync("VIN123456789", CancellationToken.None);
        Assert.Equal(47.6062, updatedVehicle!.Location.Latitude);
        Assert.Equal(-122.3321, updatedVehicle!.Location.Longitude);
    }
}