using System.Linq;
using System.Net;
using FleetService.Application.Configuration;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Domain.Events;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Infrastructure.Repositories;

public sealed class CosmosVehicleRepository : IVehicleRepository
{
    private readonly ILogger<CosmosVehicleRepository> _logger;
    private readonly IDomainEventDispatcher _dispatcher;
    private readonly CosmosOptions _options;
    private readonly CosmosClient _client;
    private Container? _container;

    public CosmosVehicleRepository(
        CosmosClient client,
        IOptions<CosmosOptions> options,
        IDomainEventDispatcher dispatcher,
        ILogger<CosmosVehicleRepository> logger)
    {
        _client = client;
        _options = options.Value;
        _dispatcher = dispatcher;
        _logger = logger;
    }

    private Container Container => _container ??= _client.GetContainer(_options.DatabaseId, _options.ContainerId);

    public async Task<IReadOnlyList<Vehicle>> GetNearbyAsync(Location center, double radiusKilometers, CancellationToken cancellationToken)
    {
        // Use separate latitude/longitude fields instead of GeoJSON location
        var sql = @"SELECT * FROM c WHERE
                    ST_DISTANCE(c.location,
                        {'type':'Point','coordinates':[@lon,@lat]}
                    ) > @maxMeters";
        sql = @"SELECT * FROM c ";
        var queryDefinition = new QueryDefinition(sql)
            .WithParameter("@lon", center.Longitude)
            .WithParameter("@lat", center.Latitude)
            .WithParameter("@maxMeters", radiusKilometers * 1000);

        var iterator = Container.GetItemQueryIterator<VehicleDocument>(queryDefinition);
        var vehicles = new List<Vehicle>();
        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken).ConfigureAwait(false);
            vehicles.AddRange(response.Select(doc => doc.ToAggregate()));
        }

        return vehicles;
    }

    public async Task<Vehicle?> GetByIdAsync(string vehicleId, CancellationToken cancellationToken)
    {
        try
        {
            var response = await Container.ReadItemAsync<VehicleDocument>(vehicleId, new PartitionKey(vehicleId), cancellationToken: cancellationToken).ConfigureAwait(false);
            return response.Resource.ToAggregate();
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task SaveAsync(Vehicle vehicle, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(vehicle);

        // Check if this is a status-only update
        var isStatusUpdate = vehicle.DomainEvents.Any(e => e is VehicleStatusChangedDomainEvent);
        var isLocationUpdate = vehicle.DomainEvents.Any(e => e is VehicleLocationUpdatedDomainEvent);

        if (isStatusUpdate && !isLocationUpdate)
        {
            // Use patch operation to only update status field, preserving telemetry data
            var patchOps = new[]
            {
                PatchOperation.Replace("/status", vehicle.Status.ToString())
            };

            try
            {
                await Container.PatchItemAsync<VehicleDocument>(
                    vehicle.Id,
                    new PartitionKey(vehicle.Id),
                    patchOps,
                    cancellationToken: cancellationToken).ConfigureAwait(false);
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                // Document doesn't exist, fall back to full upsert
                var document = VehicleDocument.FromAggregate(vehicle);
                await Container.UpsertItemAsync(document, new PartitionKey(document.VehicleId), cancellationToken: cancellationToken).ConfigureAwait(false);
            }
        }
        else
        {
            // Full document update for new vehicles or location updates
            var document = VehicleDocument.FromAggregate(vehicle);
            await Container.UpsertItemAsync(document, new PartitionKey(document.VehicleId), cancellationToken: cancellationToken).ConfigureAwait(false);
        }

        if (vehicle.DomainEvents.Count > 0)
        {
            await _dispatcher.DispatchAsync(vehicle.DomainEvents, cancellationToken).ConfigureAwait(false);
            vehicle.ClearDomainEvents();
        }
    }
}

internal sealed class VehicleDocument
{
    public string Id => VehicleId;
    public string VehicleId { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public VehicleStatus Status { get; set; }

    // Additional telemetry fields to preserve existing data
    public double? Speed { get; set; }
    public double? Heading { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public string? DeviceId { get; set; }

    /// <summary>
    /// GeoJSON Point for geospatial queries in Cosmos DB
    /// </summary>
    public object Location => new
    {
        type = "Point",
        coordinates = new[] { Longitude, Latitude }
    };

    public Vehicle ToAggregate()
    {
        var locationResult = FleetService.Domain.Location.Create(Latitude, Longitude);
        if (locationResult.IsFailure || locationResult.Value is null)
        {
            throw new InvalidOperationException("Invalid location in document.");
        }

        var vehicleResult = Vehicle.Create(VehicleId, locationResult.Value, Status);
        if (vehicleResult.IsFailure || vehicleResult.Value is null)
        {
            var errorMessage = vehicleResult.Error?.Message ?? "Unknown error";
            throw new InvalidOperationException($"Unable to recreate vehicle aggregate for {VehicleId}: {errorMessage}");
        }

        return vehicleResult.Value;
    }

    public static VehicleDocument FromAggregate(Vehicle vehicle)
        => new()
        {
            VehicleId = vehicle.Id,
            Latitude = vehicle.Location.Latitude,
            Longitude = vehicle.Location.Longitude,
            Status = vehicle.Status
        };
}
