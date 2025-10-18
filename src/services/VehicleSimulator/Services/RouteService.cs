using VehicleSimulator.Models;

namespace VehicleSimulator.Services;

public sealed class RouteService
{
    private readonly Dictionary<string, VehicleRoute> _routes = new()
    {
        ["seattle-downtown"] = new VehicleRoute("Seattle Downtown", new[]
        {//-36.864017, 174.779806
            new LocationPoint(-36.8662,174.7721),
            new LocationPoint(-36.8655,174.7740),
            new LocationPoint(-36.8670,174.7750),
            new LocationPoint(-36.8680,174.7730),
            new LocationPoint(-36.8662,174.7721)
        }),
        ["seattle-spaceneedle"] = new VehicleRoute("Space Needle Area", new[]
        {//-36.866043, 174.770584
            new LocationPoint(-36.8605, 174.7793),
            new LocationPoint(-36.8610, 174.7700),
            new LocationPoint(-36.8615, 174.7785),
            new LocationPoint(-36.8600, 174.7780),
            new LocationPoint(-36.8605, 174.7793)
        }),
        ["seattle-pioneer"] = new VehicleRoute("Pioneer Square", new[]
        {//-36.867525, 174.786315

            new LocationPoint(-36.8652,174.7716),
            new LocationPoint(-36.8645,174.7720),
            new LocationPoint(-36.8660,174.7730),
            new LocationPoint(-36.8665,174.7710),
            new LocationPoint(-36.8652,174.7716)
        })
    };

    public VehicleRoute GetRoute(string routeName)
    {
        return _routes.TryGetValue(routeName, out var route)
            ? route
            : _routes["seattle-downtown"];
    }

    public LocationPoint GetNextLocation(string routeName, int currentIndex)
    {
        var route = GetRoute(routeName);
        var nextIndex = (currentIndex + 1) % route.Points.Length;
        return route.Points[nextIndex];
    }

    public LocationPoint GetCurrentLocation(string routeName, int currentIndex)
    {
        var route = GetRoute(routeName);
        return route.Points[currentIndex % route.Points.Length];
    }
}