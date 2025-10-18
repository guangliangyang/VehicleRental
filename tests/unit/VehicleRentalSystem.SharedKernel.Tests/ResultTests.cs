using VehicleRentalSystem.SharedKernel;

namespace VehicleRentalSystem.SharedKernel.Tests;

public class ResultTests
{
    [Fact]
    public void Success_ShouldExposeValueAndMarkSuccess()
    {
        var result = Result<int>.Success(42);

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_ShouldExposeErrorAndMarkFailure()
    {
        var error = new Error("Fleet.NotFound", "Vehicle not found.");
        var result = Result<int>.Failure(error);

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
        Assert.Null(result.Value);
    }
}
