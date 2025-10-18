namespace VehicleSimulator.Configuration;

public sealed class IoTHubOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public int SendIntervalSeconds { get; set; } = 5;
}

public sealed class SimulatedVehicleOptions
{
    public string DeviceId { get; set; } = string.Empty;
    public string VehicleId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string DeviceConnectionString { get; set; } = string.Empty;
}
