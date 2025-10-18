using VehicleSimulator.Tests;

try
{
    var test = new VehicleSimulatorIoTHubTests();
    await test.SendTelemetryMessage_ToIoTHub_Succeeds();
    Console.WriteLine("Telemetry message sent successfully.");
}
catch (Exception ex)
{
    Console.Error.WriteLine("Failed to send telemetry message.");
    Console.Error.WriteLine(ex);
    Environment.ExitCode = 1;
}
