using FleetService.Domain;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.UnitTests;

public class LocationTests
{
    [Fact]
    public void Create_ShouldSucceed_WhenValidCoordinates()
    {
        var result = Location.Create(47.6062, -122.3321);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(47.6062, result.Value!.Latitude);
        Assert.Equal(-122.3321, result.Value!.Longitude);
    }

    [Fact]
    public void Create_ShouldSucceed_WhenCoordinatesAtBoundary()
    {
        var result1 = Location.Create(90, 180);
        var result2 = Location.Create(-90, -180);

        Assert.True(result1.IsSuccess);
        Assert.True(result2.IsSuccess);
        Assert.Equal(90, result1.Value!.Latitude);
        Assert.Equal(180, result1.Value!.Longitude);
        Assert.Equal(-90, result2.Value!.Latitude);
        Assert.Equal(-180, result2.Value!.Longitude);
    }

    [Theory]
    [InlineData(91, 0)]
    [InlineData(-91, 0)]
    [InlineData(100, 0)]
    [InlineData(-100, 0)]
    public void Create_ShouldFail_WhenLatitudeOutOfRange(double latitude, double longitude)
    {
        var result = Location.Create(latitude, longitude);

        Assert.True(result.IsFailure);
        Assert.Equal("Location.InvalidLatitude", result.Error?.Code);
        Assert.Equal("Latitude must be between -90 and 90.", result.Error?.Message);
    }

    [Theory]
    [InlineData(0, 181)]
    [InlineData(0, -181)]
    [InlineData(0, 200)]
    [InlineData(0, -200)]
    public void Create_ShouldFail_WhenLongitudeOutOfRange(double latitude, double longitude)
    {
        var result = Location.Create(latitude, longitude);

        Assert.True(result.IsFailure);
        Assert.Equal("Location.InvalidLongitude", result.Error?.Code);
        Assert.Equal("Longitude must be between -180 and 180.", result.Error?.Message);
    }

    [Fact]
    public void Equals_ShouldReturnTrue_WhenSameCoordinates()
    {
        var location1 = Location.Create(47.6062, -122.3321).Value!;
        var location2 = Location.Create(47.6062, -122.3321).Value!;

        Assert.Equal(location1, location2);
        Assert.True(location1.Equals(location2));
        Assert.True(location1 == location2);
        Assert.False(location1 != location2);
    }

    [Fact]
    public void Equals_ShouldReturnFalse_WhenDifferentCoordinates()
    {
        var location1 = Location.Create(47.6062, -122.3321).Value!;
        var location2 = Location.Create(47.6063, -122.3321).Value!;

        Assert.NotEqual(location1, location2);
        Assert.False(location1.Equals(location2));
        Assert.False(location1 == location2);
        Assert.True(location1 != location2);
    }

    [Fact]
    public void GetHashCode_ShouldBeSame_WhenSameCoordinates()
    {
        var location1 = Location.Create(47.6062, -122.3321).Value!;
        var location2 = Location.Create(47.6062, -122.3321).Value!;

        Assert.Equal(location1.GetHashCode(), location2.GetHashCode());
    }

    [Fact]
    public void GetHashCode_ShouldBeDifferent_WhenDifferentCoordinates()
    {
        var location1 = Location.Create(47.6062, -122.3321).Value!;
        var location2 = Location.Create(47.6063, -122.3321).Value!;

        Assert.NotEqual(location1.GetHashCode(), location2.GetHashCode());
    }

    [Fact]
    public void Equals_ShouldReturnFalse_WhenComparedToNull()
    {
        var location = Location.Create(47.6062, -122.3321).Value!;

        Assert.False(location.Equals(null));
        Assert.False(location == null);
        Assert.True(location != null);
    }

    [Fact]
    public void Equals_ShouldReturnFalse_WhenComparedToDifferentType()
    {
        var location = Location.Create(47.6062, -122.3321).Value!;
        var otherObject = "not a location";

        Assert.False(location.Equals(otherObject));
    }
}