using FleetService.Api.Extensions;

// Load environment variables from .env file
DotNetEnv.Env.Load();

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
