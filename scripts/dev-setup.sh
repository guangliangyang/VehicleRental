#!/bin/bash

# Development setup script for Vehicle Rental System
# Sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Vehicle Rental System Development Environment..."

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

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Change to project root
cd "$(dirname "$0")/.."

print_step "1. Checking prerequisites..."

# Check for .NET SDK
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    print_status "✅ .NET SDK found: $DOTNET_VERSION"
else
    print_error "❌ .NET SDK not found. Please install .NET 8 SDK"
    exit 1
fi

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "✅ Node.js found: $NODE_VERSION"
else
    print_error "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "✅ npm found: $NPM_VERSION"
else
    print_error "❌ npm not found. Please install npm"
    exit 1
fi

print_step "2. Setting up configuration files..."

# Copy configuration files if they don't exist
if [ ! -f "src/services/FleetService/FleetService.Api/.env" ]; then
    if [ -f "config/development/api.env" ]; then
        cp config/development/api.env src/services/FleetService/FleetService.Api/.env
        print_status "✅ API configuration copied"
    else
        print_warning "⚠️  API configuration template not found"
    fi
else
    print_status "✅ API configuration already exists"
fi

if [ ! -f "src/web/vehicle-rental-web/.env.production" ]; then
    if [ -f "config/production/frontend.env" ]; then
        cp config/production/frontend.env src/web/vehicle-rental-web/.env.production
        print_status "✅ Frontend configuration copied"
    else
        print_warning "⚠️  Frontend configuration template not found"
    fi
else
    print_status "✅ Frontend configuration already exists"
fi

print_step "3. Installing dependencies..."

# Install .NET dependencies
print_status "Restoring .NET packages..."
if dotnet restore src/services/VehicleRentalSystem.sln; then
    print_status "✅ .NET packages restored"
else
    print_error "❌ Failed to restore .NET packages"
    exit 1
fi

# Install Node.js dependencies
print_status "Installing Node.js packages..."
cd src/web/vehicle-rental-web
if npm install; then
    print_status "✅ Node.js packages installed"
else
    print_error "❌ Failed to install Node.js packages"
    exit 1
fi
cd ../../..

print_step "4. Building project..."
if ./scripts/build.sh; then
    print_status "✅ Project built successfully"
else
    print_error "❌ Build failed"
    exit 1
fi

print_step "5. Running tests..."
if ./scripts/test.sh; then
    print_status "✅ Tests completed"
else
    print_warning "⚠️  Some tests may have failed"
fi

print_status "🎉 Development environment setup complete!"
echo ""
print_status "Quick Start Commands:"
echo "  Start API:      dotnet run --project src/services/FleetService/FleetService.Api --urls \"http://localhost:5000\""
echo "  Start Frontend: cd src/web/vehicle-rental-web && npm start"
echo "  Start Simulator: dotnet run --project src/services/VehicleSimulator"
echo ""
print_status "Available URLs:"
echo "  API:            http://localhost:5000"
echo "  Swagger:        http://localhost:5000/swagger"
echo "  Frontend:       http://localhost:3000"
echo ""
print_status "Development Scripts:"
echo "  Build:          ./scripts/build.sh"
echo "  Test:           ./scripts/test.sh"
echo "  Clean:          ./scripts/clean.sh"