using VehicleRentalSystem.SharedKernel;

namespace FleetService.Domain;

public sealed class Location : ValueObject
{
    public double Latitude { get; }
    public double Longitude { get; }

    private Location(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public static Result<Location> Create(double latitude, double longitude)
    {
        if (latitude is < -90 or > 90)
        {
            return Result<Location>.Failure(new Error("Location.InvalidLatitude", "Latitude must be between -90 and 90."));
        }

        if (longitude is < -180 or > 180)
        {
            return Result<Location>.Failure(new Error("Location.InvalidLongitude", "Longitude must be between -180 and 180."));
        }

        return Result<Location>.Success(new Location(latitude, longitude));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
    }
}
