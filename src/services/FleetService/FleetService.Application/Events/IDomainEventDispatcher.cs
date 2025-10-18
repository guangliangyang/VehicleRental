using VehicleRentalSystem.SharedKernel;

namespace FleetService.Application.Events;

/// <summary>
/// Defines the contract for dispatching domain events to their handlers
/// </summary>
public interface IDomainEventDispatcher
{
    Task DispatchAsync(IEnumerable<IDomainEvent> domainEvents, CancellationToken cancellationToken);
}