namespace VehicleRentalSystem.SharedKernel;

/// <summary>
/// Functional result type for passing success/failure across layers.
/// </summary>
public sealed class Result<T>
{
    private Result(bool isSuccess, T? value, Error? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public T? Value { get; }

    public Error? Error { get; }

    public static Result<T> Success(T value) => new(true, value, null);

    public static Result<T> Failure(Error error) => new(false, default, error);
}

/// <summary>
/// Unit type for representing void operations in a functional way.
/// </summary>
public readonly record struct Unit
{
    public static readonly Unit Value = new();
}

/// <summary>
/// Lightweight error record to standardize failure responses.
/// </summary>
/// <param name="Code">Stable identifier.</param>
/// <param name="Message">Human-readable description.</param>
public readonly record struct Error(string Code, string Message)
{
    public static readonly Error None = new("None", string.Empty);
}
