using FleetService.Domain;
using FleetService.Domain.Events;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application.Events;

public sealed class VehicleDomainEventHandler :
    IDomainEventHandler<VehicleStatusChangedDomainEvent>,
    IDomainEventHandler<VehicleLocationUpdatedDomainEvent>
{
    public Task HandleAsync(VehicleStatusChangedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Domain event handled - no real-time notifications needed
        return Task.CompletedTask;
    }

    public Task HandleAsync(VehicleLocationUpdatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        // Domain event handled - no real-time notifications needed
        return Task.CompletedTask;
    }
}
