using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehicleSimulator.Configuration;
using VehicleSimulator.Services;

// Load environment variables from .env file
DotNetEnv.Env.Load();

var builder = Host.CreateApplicationBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Configure options
builder.Services.Configure<IoTHubOptions>(builder.Configuration.GetSection("IoTHub"));

// Configure vehicles array with environment variable substitution
var vehiclesConfig = builder.Configuration.GetSection("SimulatedVehicles").Get<SimulatedVehicleOptions[]>() ?? Array.Empty<SimulatedVehicleOptions>();

// Replace connection strings from environment variables
for (int i = 0; i < vehiclesConfig.Length; i++)
{
    var deviceId = vehiclesConfig[i].DeviceId;
    var envVarName = deviceId switch
    {
        "TBOX-SEATTLE-001" => "DEVICE_CONNECTION_STRING_SEATTLE_001",
        "TBOX-SEATTLE-002" => "DEVICE_CONNECTION_STRING_SEATTLE_002",
        "TBOX-SEATTLE-003" => "DEVICE_CONNECTION_STRING_SEATTLE_003",
        _ => null
    };

    if (envVarName != null)
    {
        var connectionString = Environment.GetEnvironmentVariable(envVarName);
        if (!string.IsNullOrEmpty(connectionString))
        {
            vehiclesConfig[i] = vehiclesConfig[i] with { DeviceConnectionString = connectionString };
        }
    }
}

builder.Services.AddSingleton(vehiclesConfig);

// Register services
builder.Services.AddSingleton<RouteService>();
builder.Services.AddHostedService<VehicleSimulatorService>();

var host = builder.Build();

var logger = host.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Starting Vehicle TBOX Simulator");
logger.LogInformation("Press Ctrl+C to stop the simulator");

try
{
    await host.RunAsync();
}
catch (Exception ex)
{
    logger.LogCritical(ex, "Application terminated unexpectedly");
}
finally
{
    logger.LogInformation("Vehicle TBOX Simulator stopped");
}