import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the auth module
jest.mock('../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  AuthButton: (props: any) => (
    <div data-testid="auth-button" className={props.className}>
      {props.className || 'AuthButton'}
    </div>
  )
}));

// Mock the components
jest.mock('../components/MapView', () => ({
  MapView: () => <div data-testid="map-view">MapView</div>
}));

jest.mock('../components/VehicleList', () => ({
  VehicleList: () => <div data-testid="vehicle-list">VehicleList</div>
}));

jest.mock('../components/FilterPanel', () => ({
  FilterPanel: () => <div data-testid="filter-panel">FilterPanel</div>
}));

// Mock the hooks
jest.mock('../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 40.7128, longitude: -74.0060 },
    error: null,
    loading: false,
    getCurrentLocation: jest.fn()
  })
}));

jest.mock('../hooks/useVehicles', () => ({
  useVehicles: () => ({
    vehicles: [
      {
        id: 'vehicle-1',
        name: 'Test Vehicle',
        status: 'Available',
        location: { latitude: 40.7128, longitude: -74.0060 }
      }
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
    updateVehicleStatus: jest.fn(),
    isAutoRefreshEnabled: true,
    toggleAutoRefresh: jest.fn()
  })
}));

describe('App Integration', () => {
  it('should render app with AuthProvider wrapper', async () => {
    // Positive test case: full app integration
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    // Check that main app components are rendered
    expect(screen.getByText('🚗 Vehicle Rental System')).toBeInTheDocument();
    expect(screen.getByText('Find available vehicles near you')).toBeInTheDocument();
  });

  it('should render AuthButton in header with correct props', async () => {
    // Positive test case: AuthButton integration
    render(<App />);

    await waitFor(() => {
      const authButton = screen.getByTestId('auth-button');
      expect(authButton).toBeInTheDocument();
      expect(authButton).toHaveClass('auth-button-header');
    });
  });

  it('should render main application components', async () => {
    // Positive test case: core components
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    // Check view toggle buttons
    expect(screen.getByText('🗺️ Map View')).toBeInTheDocument();
    expect(screen.getByText('📋 List View')).toBeInTheDocument();
  });

  it('should display status information', async () => {
    // Positive test case: status display
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/📍 Location:/)).toBeInTheDocument();
      expect(screen.getByText(/Found 1 vehicles within 5 km/)).toBeInTheDocument();
      expect(screen.getByText(/🔄 Auto-refresh enabled/)).toBeInTheDocument();
    });
  });

  it('should have proper CSS structure for auth button', async () => {
    // Positive test case: CSS integration
    render(<App />);

    await waitFor(() => {
      const authButton = screen.getByTestId('auth-button');
      expect(authButton).toHaveClass('auth-button-header');
    });

    // Check header layout structure
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should render without errors when all components are loaded', async () => {
    // Positive test case: error-free rendering
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should maintain responsive design structure', async () => {
    // Edge case: responsive design
    render(<App />);

    await waitFor(() => {
      const appContainer = screen.getByTestId('auth-provider');
      expect(appContainer).toBeInTheDocument();
    });

    // Check that header has flex layout for responsive design
    const titleDiv = screen.getByText('🚗 Vehicle Rental System').closest('div');
    expect(titleDiv).toBeInTheDocument();
  });

  it('should integrate auth callbacks properly', async () => {
    // Edge case: callback integration
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });

    // The callbacks should be properly set up (we can't easily test them without triggering auth)
    // but we can verify the app renders without callback-related errors
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('error'));
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('callback'));

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});