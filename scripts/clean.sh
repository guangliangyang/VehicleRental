#!/bin/bash

# Clean script for Vehicle Rental System
# Removes build artifacts and temporary files

set -e  # Exit on any error

echo "🧹 Cleaning Vehicle Rental System build artifacts..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to project root
cd "$(dirname "$0")/.."

print_status "Cleaning .NET build artifacts..."

# Clean .NET projects
if dotnet clean src/services/VehicleRentalSystem.sln; then
    print_status "✅ .NET clean completed"
else
    print_warning "⚠️  .NET clean had warnings"
fi

# Remove bin and obj directories
print_status "Removing bin/ and obj/ directories..."
find . -name "bin" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "obj" -type d -exec rm -rf {} + 2>/dev/null || true
print_status "✅ bin/ and obj/ directories removed"

# Clean frontend build artifacts
print_status "Cleaning frontend build artifacts..."
if [ -d "src/web/vehicle-rental-web/build" ]; then
    rm -rf src/web/vehicle-rental-web/build
    print_status "✅ Frontend build directory removed"
fi

if [ -d "src/web/vehicle-rental-web/node_modules" ]; then
    print_warning "⚠️  node_modules directory found (use 'rm -rf src/web/vehicle-rental-web/node_modules' to remove)"
fi

# Clean test results
print_status "Cleaning test results..."
if [ -d "TestResults" ]; then
    rm -rf TestResults
    print_status "✅ Test results removed"
fi

# Clean coverage reports
if [ -d "coverage" ]; then
    rm -rf coverage
    print_status "✅ Coverage reports removed"
fi

# Clean temporary files
print_status "Cleaning temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true
print_status "✅ Temporary files removed"

# Clean log files
print_status "Cleaning log files..."
find . -name "*.log" -delete 2>/dev/null || true
print_status "✅ Log files removed"

# Clean NuGet cache (optional)
if [ "$1" = "--deep" ]; then
    print_status "Performing deep clean..."
    dotnet nuget locals all --clear
    print_status "✅ NuGet cache cleared"

    if [ -d "src/web/vehicle-rental-web/node_modules" ]; then
        rm -rf src/web/vehicle-rental-web/node_modules
        print_status "✅ node_modules removed"
    fi

    if [ -f "src/web/vehicle-rental-web/package-lock.json" ]; then
        rm src/web/vehicle-rental-web/package-lock.json
        print_status "✅ package-lock.json removed"
    fi
fi

print_status "🎉 Clean completed successfully!"

if [ "$1" != "--deep" ]; then
    echo ""
    print_status "💡 Tip: Use './scripts/clean.sh --deep' for deep cleaning (removes node_modules and NuGet cache)"
fi