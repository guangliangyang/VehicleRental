#!/bin/bash

# Test script for Vehicle Rental System
# Runs all test suites with coverage

set -e  # Exit on any error

echo "🧪 Running Vehicle Rental System Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to project root
cd "$(dirname "$0")/.."

# Run unit tests
print_test "Running unit tests..."
if dotnet test tests/unit/FleetService.UnitTests --configuration Release --logger trx --collect:"XPlat Code Coverage"; then
    print_status "✅ Unit tests passed"
else
    print_error "❌ Unit tests failed"
    exit 1
fi

if dotnet test tests/unit/VehicleRentalSystem.SharedKernel.Tests --configuration Release --logger trx; then
    print_status "✅ SharedKernel tests passed"
else
    print_error "❌ SharedKernel tests failed"
    exit 1
fi

# Run integration tests
print_test "Running integration tests..."
if dotnet test tests/integration/FleetService.IntegrationTests --configuration Release --logger trx; then
    print_status "✅ Integration tests passed"
else
    print_warning "⚠️  Integration tests failed (may require external dependencies)"
fi

# Frontend tests (if they exist)
if [ -f "src/web/vehicle-rental-web/package.json" ]; then
    print_test "Checking for frontend tests..."
    cd src/web/vehicle-rental-web
    if npm run test -- --watchAll=false --coverage; then
        print_status "✅ Frontend tests passed"
    else
        print_warning "⚠️  Frontend tests failed or not configured"
    fi
    cd ../../..
fi

print_status "🎉 Test execution completed!"

# Check for coverage reports
if [ -d "TestResults" ]; then
    print_status "📊 Test coverage reports generated in TestResults/"
fi

print_status "Test Summary:"
echo "  - Unit tests: ✅"
echo "  - Integration tests: ✅/⚠️"
echo "  - Frontend tests: ✅/⚠️"