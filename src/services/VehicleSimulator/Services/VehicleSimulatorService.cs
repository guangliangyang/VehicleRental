using System.Text;
using System.Text.Json;
using Microsoft.Azure.Devices.Client;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VehicleSimulator.Configuration;
using VehicleSimulator.Models;

namespace VehicleSimulator.Services;

public sealed class VehicleSimulatorService : IHostedService, IAsyncDisposable
{
    private readonly IoTHubOptions _iotHubOptions;
    private readonly SimulatedVehicleOptions[] _vehicles;
    private readonly RouteService _routeService;
    private readonly ILogger<VehicleSimulatorService> _logger;
    private readonly Dictionary<string, DeviceClient> _deviceClients = new();
    private readonly Dictionary<string, int> _routePositions = new();
    private readonly Dictionary<string, VehicleStatus> _vehicleStatuses = new();
    private readonly Random _random = new();
    private CancellationTokenSource? _cancellationTokenSource;
    private Task? _simulationTask;

    public VehicleSimulatorService(
        IOptions<IoTHubOptions> iotHubOptions,
        SimulatedVehicleOptions[] vehicles,
        RouteService routeService,
        ILogger<VehicleSimulatorService> logger)
    {
        _iotHubOptions = iotHubOptions.Value;
        _vehicles = vehicles;
        _routeService = routeService;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting Vehicle Simulator with {Count} vehicles", _vehicles.Length);

        // Initialize device clients
        foreach (var vehicle in _vehicles)
        {
            try
            {
                var deviceConnectionString = ResolveDeviceConnectionString(vehicle);
                if (deviceConnectionString is null)
                {
                    throw new InvalidOperationException($"No connection string for device {vehicle.DeviceId}");
                }

                var deviceClient = DeviceClient.CreateFromConnectionString(deviceConnectionString, TransportType.Mqtt);
                await deviceClient.OpenAsync(cancellationToken);

                _deviceClients[vehicle.DeviceId] = deviceClient;
                _routePositions[vehicle.DeviceId] = 0;
                _vehicleStatuses[vehicle.DeviceId] = VehicleStatus.Available;

                _logger.LogInformation("Connected device {DeviceId} for vehicle {VehicleName}",
                    vehicle.DeviceId, vehicle.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect device {DeviceId}", vehicle.DeviceId);
            }
        }

        // Start simulation
        _cancellationTokenSource = new CancellationTokenSource();
        _simulationTask = SimulateVehiclesAsync(_cancellationTokenSource.Token);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping Vehicle Simulator");

        _cancellationTokenSource?.Cancel();

        if (_simulationTask != null)
        {
            await _simulationTask;
        }

        foreach (var deviceClient in _deviceClients.Values)
        {
            await deviceClient.CloseAsync();
        }
    }

    private string? ResolveDeviceConnectionString(SimulatedVehicleOptions vehicle)
    {
        if (!string.IsNullOrWhiteSpace(vehicle.DeviceConnectionString))
        {
            return vehicle.DeviceConnectionString;
        }


        _logger.LogError("No connection string configured for device {DeviceId}", vehicle.DeviceId);

        throw new InvalidOperationException($"No connection string configured for device {vehicle.DeviceId}"); 
    }

    private async Task SimulateVehiclesAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var tasks = _vehicles.Select(vehicle => SendTelemetryAsync(vehicle, cancellationToken));
                await Task.WhenAll(tasks);

                await Task.Delay(TimeSpan.FromSeconds(_iotHubOptions.SendIntervalSeconds), cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in simulation loop");
                await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
            }
        }
    }

    private async Task SendTelemetryAsync(SimulatedVehicleOptions vehicle, CancellationToken cancellationToken)
    {
        if (!_deviceClients.TryGetValue(vehicle.DeviceId, out var deviceClient))
        {
            return;
        }

        try
        {
            // Update vehicle position
            var currentPosition = _routePositions[vehicle.DeviceId];
            var location = _routeService.GetCurrentLocation(vehicle.Route, currentPosition);

            // Add some random variation to position (±0.0001 degrees ≈ ±11 meters)
            var randomLat = location.Latitude + (_random.NextDouble() - 0.5) * 0.0002;
            var randomLng = location.Longitude + (_random.NextDouble() - 0.5) * 0.0002;

            // Advance position
            _routePositions[vehicle.DeviceId] = (currentPosition + 1) % 100; // Slow down movement

            // Randomly change vehicle status occasionally
            if (_random.Next(100) < 2) // 2% chance per message
            {
                _vehicleStatuses[vehicle.DeviceId] = _random.Next(10) < 8
                    ? VehicleStatus.Available
                    : VehicleStatus.Rented;
            }

            var telemetry = new VehicleTelemetryMessage(
                VehicleId: vehicle.VehicleId,
                Latitude: randomLat,
                Longitude: randomLng,
                Status: _vehicleStatuses[vehicle.DeviceId].ToString(),
                Speed: _random.NextDouble() * 60 + 10, // 10-70 km/h
                Heading: _random.NextDouble() * 360,
                Timestamp: DateTimeOffset.UtcNow,
                DeviceId: vehicle.DeviceId);

            var json = JsonSerializer.Serialize(telemetry, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var message = new Message(Encoding.UTF8.GetBytes(json))
            {
                ContentType = "application/json",
                ContentEncoding = "utf-8"
            };

            await deviceClient.SendEventAsync(message, cancellationToken);

            _logger.LogDebug("Sent telemetry for {DeviceId}: Lat={Lat}, Lng={Lng}, Status={Status}",
                vehicle.DeviceId, randomLat, randomLng, telemetry.Status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send telemetry for device {DeviceId}", vehicle.DeviceId);
        }
    }

    public async ValueTask DisposeAsync()
    {
        _cancellationTokenSource?.Cancel();

        if (_simulationTask != null)
        {
            await _simulationTask;
        }

        foreach (var deviceClient in _deviceClients.Values)
        {
            deviceClient.Dispose();
        }

        _cancellationTokenSource?.Dispose();
    }
}
