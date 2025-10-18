using FleetService.Application.Events;
using FleetService.Domain.Events;
using Microsoft.Extensions.DependencyInjection;
using VehicleRentalSystem.SharedKernel;

namespace FleetService.Infrastructure.Events;

public sealed class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DomainEventDispatcher(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task DispatchAsync(IEnumerable<IDomainEvent> domainEvents, CancellationToken cancellationToken)
    {
        foreach (var domainEvent in domainEvents)
        {
            var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(domainEvent.GetType());

            using var scope = _scopeFactory.CreateScope();
            var handlers = scope.ServiceProvider.GetServices(handlerType);

            foreach (var handler in handlers)
            {
                var method = handlerType.GetMethod(nameof(IDomainEventHandler<IDomainEvent>.HandleAsync));
                if (method is null)
                {
                    continue;
                }

                var task = (Task?)method.Invoke(handler, new object?[] { domainEvent, cancellationToken });
                if (task is not null)
                {
                    await task.ConfigureAwait(false);
                }
            }
        }
    }
}
