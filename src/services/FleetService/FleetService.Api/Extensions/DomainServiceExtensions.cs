using FleetService.Application;
using FleetService.Application.Events;
using FleetService.Domain;
using FleetService.Domain.Events;
using FleetService.Infrastructure.Events;

namespace FleetService.Api.Extensions;

public static class DomainServiceExtensions
{
    /// <summary>
    /// Configures domain services including event handling
    /// </summary>
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddSingleton<IDomainEventDispatcher, DomainEventDispatcher>();
        services.AddScoped<IDomainEventHandler<VehicleStatusChangedDomainEvent>, VehicleDomainEventHandler>();
        services.AddScoped<IDomainEventHandler<VehicleLocationUpdatedDomainEvent>, VehicleDomainEventHandler>();
        services.AddScoped<IVehicleQueryService, VehicleQueryService>();
        services.AddScoped<IVehicleCommandService, VehicleCommandService>();

        return services;
    }
}