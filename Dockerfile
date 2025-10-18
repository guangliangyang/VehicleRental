# Use the official ASP.NET Core runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for restore (only FleetService projects)
COPY ["src/services/FleetService/FleetService.Api/FleetService.Api.csproj", "src/services/FleetService/FleetService.Api/"]
COPY ["src/services/FleetService/FleetService.Application/FleetService.Application.csproj", "src/services/FleetService/FleetService.Application/"]
COPY ["src/services/FleetService/FleetService.Domain/FleetService.Domain.csproj", "src/services/FleetService/FleetService.Domain/"]
COPY ["src/services/FleetService/FleetService.Infrastructure/FleetService.Infrastructure.csproj", "src/services/FleetService/FleetService.Infrastructure/"]
COPY ["src/services/VehicleRentalSystem.SharedKernel/VehicleRentalSystem.SharedKernel.csproj", "src/services/VehicleRentalSystem.SharedKernel/"]

# Restore dependencies for API project only
RUN dotnet restore "src/services/FleetService/FleetService.Api/FleetService.Api.csproj"

# Copy source code
COPY ["src/services/FleetService/", "src/services/FleetService/"]
COPY ["src/services/VehicleRentalSystem.SharedKernel/", "src/services/VehicleRentalSystem.SharedKernel/"]

# Build the application
WORKDIR "/src/src/services/FleetService/FleetService.Api"
RUN dotnet build "FleetService.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "FleetService.Api.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "FleetService.Api.dll"]