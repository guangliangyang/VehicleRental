namespace VehicleSimulator.Configuration;

public sealed class IoTHubOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public int SendIntervalSeconds { get; set; } = 5;
}

public sealed record SimulatedVehicleOptions(
    string DeviceId = "",
    string VehicleId = "",
    string Name = "",
    string Route = "",
    string DeviceConnectionString = "");
