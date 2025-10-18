# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/services/FleetService/FleetService.Api/FleetService.Api.csproj", "FleetService.Api/"]
COPY ["src/services/FleetService/FleetService.Application/FleetService.Application.csproj", "FleetService.Application/"]
COPY ["src/services/FleetService/FleetService.Domain/FleetService.Domain.csproj", "FleetService.Domain/"]
COPY ["src/services/FleetService/FleetService.Infrastructure/FleetService.Infrastructure.csproj", "FleetService.Infrastructure/"]
COPY ["src/services/VehicleRentalSystem.SharedKernel/VehicleRentalSystem.SharedKernel.csproj", "VehicleRentalSystem.SharedKernel/"]

# Restore dependencies
RUN dotnet restore "FleetService.Api/FleetService.Api.csproj"

# Copy source code
COPY src/services/FleetService/ FleetService/
COPY src/services/VehicleRentalSystem.SharedKernel/ VehicleRentalSystem.SharedKernel/

# Build the application
WORKDIR /src/FleetService/FleetService.Api
RUN dotnet build "FleetService.Api.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "FleetService.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Copy published application
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "FleetService.Api.dll"]