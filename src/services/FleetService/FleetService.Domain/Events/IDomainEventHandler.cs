using VehicleRentalSystem.SharedKernel;

namespace FleetService.Domain.Events;

/// <summary>
/// Defines the contract for handling domain events within the domain boundary
/// </summary>
public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken);
}