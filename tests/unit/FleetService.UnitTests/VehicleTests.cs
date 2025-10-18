using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.UnitTests;

public class VehicleTests
{
    [Fact]
    public void Create_ShouldSucceed_WhenValidParameters()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        Assert.True(locationResult.IsSuccess);

        var result = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("VIN123456789", result.Value!.Id);
        Assert.Equal(VehicleStatus.Available, result.Value!.Status);
        Assert.Equal(47.6062, result.Value!.Location.Latitude);
        Assert.Equal(-122.3321, result.Value!.Location.Longitude);
    }

    [Fact]
    public void Create_ShouldFail_WhenIdIsEmpty()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        Assert.True(locationResult.IsSuccess);

        var result = Vehicle.Create("", locationResult.Value!, VehicleStatus.Available);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidId", result.Error?.Code);
    }

    [Fact]
    public void Create_ShouldFail_WhenIdIsNull()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        Assert.True(locationResult.IsSuccess);

        var result = Vehicle.Create(null!, locationResult.Value!, VehicleStatus.Available);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidId", result.Error?.Code);
    }

    [Fact]
    public void Create_ShouldFail_WhenLocationIsNull()
    {
        Assert.Throws<ArgumentNullException>(() =>
            Vehicle.Create("VIN123456789", null!, VehicleStatus.Available));
    }

    [Fact]
    public void UpdateStatus_ShouldSucceed_WhenValidStatus()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;

        var result = vehicle.UpdateStatus(VehicleStatus.Rented);

        Assert.True(result.IsSuccess);
        Assert.Equal(VehicleStatus.Rented, vehicle.Status);
        Assert.Single(vehicle.DomainEvents);
        Assert.IsType<VehicleStatusChangedDomainEvent>(vehicle.DomainEvents.First());
    }

    [Fact]
    public void UpdateStatus_ShouldReturnSameStatus_WhenStatusUnchanged()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;

        var result = vehicle.UpdateStatus(VehicleStatus.Available);

        Assert.True(result.IsSuccess);
        Assert.Equal(VehicleStatus.Available, vehicle.Status);
        Assert.Empty(vehicle.DomainEvents);
    }

    [Fact]
    public void UpdateStatus_ShouldFail_WhenInvalidStatus()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;

        var result = vehicle.UpdateStatus(VehicleStatus.Unknown);

        Assert.True(result.IsFailure);
        Assert.Equal("Vehicle.InvalidStatus", result.Error?.Code);
    }

    [Fact]
    public void UpdateLocation_ShouldSucceed_WhenValidLocation()
    {
        var initialLocationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", initialLocationResult.Value!, VehicleStatus.Available).Value!;

        var newLocationResult = Location.Create(47.6205, -122.3493);
        Assert.True(newLocationResult.IsSuccess);

        vehicle.UpdateLocation(newLocationResult.Value!);

        Assert.Equal(47.6205, vehicle.Location.Latitude);
        Assert.Equal(-122.3493, vehicle.Location.Longitude);
        Assert.Single(vehicle.DomainEvents);
        Assert.IsType<VehicleLocationUpdatedDomainEvent>(vehicle.DomainEvents.First());
    }

    [Fact]
    public void UpdateLocation_ShouldFail_WhenLocationIsNull()
    {
        var locationResult = Location.Create(47.6062, -122.3321);
        var vehicle = Vehicle.Create("VIN123456789", locationResult.Value!, VehicleStatus.Available).Value!;

        Assert.Throws<ArgumentNullException>(() => vehicle.UpdateLocation(null!));
    }
}