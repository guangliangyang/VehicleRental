using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehicleSimulator.Configuration;
using VehicleSimulator.Services;

var builder = Host.CreateApplicationBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Configure options
builder.Services.Configure<IoTHubOptions>(builder.Configuration.GetSection("IoTHub"));

// Configure vehicles array differently
var vehiclesConfig = builder.Configuration.GetSection("SimulatedVehicles").Get<SimulatedVehicleOptions[]>() ?? Array.Empty<SimulatedVehicleOptions>();
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