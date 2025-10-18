using FleetService.Api.Extensions;

// Load environment variables from .env file (optional for container environments)
if (File.Exists(".env"))
{
    DotNetEnv.Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddApiServices();
builder.Services.AddCosmosServices(builder.Configuration);
builder.Services.AddDomainServices();

var app = builder.Build();

// Configure middleware pipeline
app.ConfigureMiddleware();

// Configure routing
app.MapVehicleEndpoints();

// Initialize services
await app.InitializeServicesAsync();

app.Run();
