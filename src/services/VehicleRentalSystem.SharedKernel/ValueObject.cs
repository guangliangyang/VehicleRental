using System.Collections.Immutable;
using System.Reflection;

namespace VehicleRentalSystem.SharedKernel;

/// <summary>
/// Provides structural equality semantics for immutable value objects.
/// </summary>
public abstract class ValueObject : IEquatable<ValueObject>
{
    private static readonly MethodInfo EqualityComponentsMethod =
        typeof(ValueObject).GetMethod(nameof(GetEqualityComponents), BindingFlags.Instance | BindingFlags.NonPublic)!;

    public bool Equals(ValueObject? other)
    {
        if (other is null || other.GetType() != GetType())
        {
            return false;
        }

        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override bool Equals(object? obj) => Equals(obj as ValueObject);

    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Aggregate(0, (hash, component) => HashCode.Combine(hash, component?.GetHashCode() ?? 0));
    }

    protected abstract IEnumerable<object?> GetEqualityComponents();

    public static bool operator ==(ValueObject? left, ValueObject? right)
        => Equals(left, right);

    public static bool operator !=(ValueObject? left, ValueObject? right)
        => !Equals(left, right);
}
