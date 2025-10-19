#!/bin/bash

# Build script for Vehicle Rental System
# Builds all components in the correct order

set -e  # Exit on any error

echo "🏗️  Building Vehicle Rental System..."

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

print_status "Building .NET solution..."
if dotnet build src/services/VehicleRentalSystem.sln --configuration Release; then
    print_status "✅ .NET build successful"
else
    print_error "❌ .NET build failed"
    exit 1
fi

print_status "Installing frontend dependencies..."
cd src/web/vehicle-rental-web
if npm ci; then
    print_status "✅ NPM dependencies installed"
else
    print_error "❌ NPM install failed"
    exit 1
fi

print_status "Building React application..."
if npm run build; then
    print_status "✅ React build successful"
else
    print_error "❌ React build failed"
    exit 1
fi

cd ../../..

print_status "🎉 Build completed successfully!"
print_status "Next steps:"
echo "  - Run tests: ./scripts/test.sh"
echo "  - Start development: ./scripts/dev-setup.sh"