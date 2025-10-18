namespace VehicleRentalSystem.SharedKernel;

/// <summary>
/// Marker interface for domain events to ensure consistency across services.
/// </summary>
public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}

public abstract record DomainEvent(DateTime OccurredOn) : IDomainEvent
{
    protected DomainEvent()
        : this(DateTime.UtcNow)
    {
    }
}
