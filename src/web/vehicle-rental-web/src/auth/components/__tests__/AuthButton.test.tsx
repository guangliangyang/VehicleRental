import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthButton, AuthButtonProps } from '../AuthButton';
import { useAuth } from '../../AuthContext';

// Mock the useAuth hook
jest.mock('../../AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthButton', () => {
  const defaultAuthState = {
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: jest.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthState);
  });

  describe('loading state', () => {
    it('should display loading button when loading is true', () => {
      // Positive test case: loading state
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        loading: true
      });

      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-loading');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Loading...');
      expect(button).toBeDisabled();
    });

    it('should display custom loading text', () => {
      // Positive test case: custom loading text
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        loading: true
      });

      render(<AuthButton loadingText="Please wait..." />);

      const button = screen.getByTestId('auth-button-loading');
      expect(button).toHaveTextContent('Please wait...');
    });

    it('should apply custom className when loading', () => {
      // Positive test case: custom className during loading
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        loading: true
      });

      render(<AuthButton className="custom-class" />);

      const button = screen.getByTestId('auth-button-loading');
      expect(button).toHaveClass('auth-button', 'auth-button--loading', 'custom-class');
    });
  });

  describe('unauthenticated state', () => {
    it('should display login button when not authenticated', () => {
      // Positive test case: unauthenticated state
      render(<AuthButton />);

      const container = screen.getByTestId('auth-button-unauthenticated');
      const button = screen.getByTestId('auth-button-login');

      expect(container).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Sign In');
    });

    it('should display custom login text', () => {
      // Positive test case: custom login text
      render(<AuthButton loginText="Login Now" />);

      const button = screen.getByTestId('auth-button-login');
      expect(button).toHaveTextContent('Login Now');
    });

    it('should handle login button click', async () => {
      // Positive test case: login click handler
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        login: mockLogin
      });

      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-login');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onLoginSuccess callback after successful login', async () => {
      // Positive test case: login success callback
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      const onLoginSuccess = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        login: mockLogin
      });

      render(<AuthButton onLoginSuccess={onLoginSuccess} />);

      const button = screen.getByTestId('auth-button-login');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle login failure and call onError callback', async () => {
      // Negative test case: login failure
      const loginError = new Error('Login failed');
      const mockLogin = jest.fn().mockRejectedValue(loginError);
      const onError = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        login: mockLogin
      });

      render(<AuthButton onError={onError} />);

      const button = screen.getByTestId('auth-button-login');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Login failed');
      });
    });

    it('should handle non-Error login failure', async () => {
      // Edge case: non-Error object thrown
      const mockLogin = jest.fn().mockRejectedValue('String error');
      const onError = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        login: mockLogin
      });

      render(<AuthButton onError={onError} />);

      const button = screen.getByTestId('auth-button-login');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Login failed');
      });
    });

    it('should display error message when error exists', () => {
      // Negative test case: error state
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Authentication failed'
      });

      render(<AuthButton />);

      const errorElement = screen.getByTestId('auth-button-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Authentication failed');
    });
  });

  describe('authenticated state', () => {
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      username: 'john@example.com'
    };

    it('should display logout button and user info when authenticated', () => {
      // Positive test case: authenticated state with user info
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser
      });

      render(<AuthButton />);

      const container = screen.getByTestId('auth-button-authenticated');
      const userInfo = screen.getByTestId('auth-button-user-info');
      const button = screen.getByTestId('auth-button-logout');

      expect(container).toBeInTheDocument();
      expect(userInfo).toBeInTheDocument();
      expect(userInfo).toHaveTextContent('Welcome, John Doe');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Sign Out');
    });

    it('should hide user info when showUserInfo is false', () => {
      // Edge case: hide user info
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser
      });

      render(<AuthButton showUserInfo={false} />);

      const container = screen.getByTestId('auth-button-authenticated');
      expect(container).toBeInTheDocument();
      expect(screen.queryByTestId('auth-button-user-info')).not.toBeInTheDocument();
    });

    it('should not display user info when user is null', () => {
      // Edge case: authenticated but no user object
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: null
      });

      render(<AuthButton />);

      const container = screen.getByTestId('auth-button-authenticated');
      expect(container).toBeInTheDocument();
      expect(screen.queryByTestId('auth-button-user-info')).not.toBeInTheDocument();
    });

    it('should display custom logout text', () => {
      // Positive test case: custom logout text
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser
      });

      render(<AuthButton logoutText="Logout Now" />);

      const button = screen.getByTestId('auth-button-logout');
      expect(button).toHaveTextContent('Logout Now');
    });

    it('should handle logout button click', async () => {
      // Positive test case: logout click handler
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      });

      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-logout');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onLogoutSuccess callback after successful logout', async () => {
      // Positive test case: logout success callback
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      const onLogoutSuccess = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      });

      render(<AuthButton onLogoutSuccess={onLogoutSuccess} />);

      const button = screen.getByTestId('auth-button-logout');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onLogoutSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle logout failure and call onError callback', async () => {
      // Negative test case: logout failure
      const logoutError = new Error('Logout failed');
      const mockLogout = jest.fn().mockRejectedValue(logoutError);
      const onError = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      });

      render(<AuthButton onError={onError} />);

      const button = screen.getByTestId('auth-button-logout');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Logout failed');
      });
    });

    it('should handle non-Error logout failure', async () => {
      // Edge case: non-Error object thrown during logout
      const mockLogout = jest.fn().mockRejectedValue('String error');
      const onError = jest.fn();

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      });

      render(<AuthButton onError={onError} />);

      const button = screen.getByTestId('auth-button-logout');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Logout failed');
      });
    });

    it('should display error message in authenticated state', () => {
      // Negative test case: error in authenticated state
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser,
        error: 'Token refresh failed'
      });

      render(<AuthButton />);

      const errorElement = screen.getByTestId('auth-button-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Token refresh failed');
    });
  });

  describe('prop handling', () => {
    it('should apply custom className to container', () => {
      // Positive test case: custom className application
      render(<AuthButton className="my-custom-class" />);

      const container = screen.getByTestId('auth-button-unauthenticated');
      expect(container).toHaveClass('auth-button-container', 'my-custom-class');
    });

    it('should not call callbacks when they are not provided', async () => {
      // Edge case: no callbacks provided
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        login: mockLogin
      });

      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-login');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
      // Should not throw errors when callbacks are undefined
    });

    it('should handle all default prop values', () => {
      // Positive test case: all default values
      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-login');
      expect(button).toHaveTextContent('Sign In');

      const container = screen.getByTestId('auth-button-unauthenticated');
      expect(container).toHaveClass('auth-button-container');
    });

    it('should handle empty className', () => {
      // Edge case: empty className
      render(<AuthButton className="" />);

      const container = screen.getByTestId('auth-button-unauthenticated');
      expect(container).toHaveClass('auth-button-container');
    });
  });

  describe('component structure and CSS classes', () => {
    it('should apply correct CSS classes for login button', () => {
      // Positive test case: CSS class validation for login
      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-login');
      expect(button).toHaveClass('auth-button', 'auth-button--login');
    });

    it('should apply correct CSS classes for logout button', () => {
      // Positive test case: CSS class validation for logout
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'john@example.com'
      };

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser
      });

      render(<AuthButton />);

      const button = screen.getByTestId('auth-button-logout');
      expect(button).toHaveClass('auth-button', 'auth-button--logout');
    });

    it('should apply correct CSS classes for user info', () => {
      // Positive test case: CSS class validation for user info
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'john@example.com'
      };

      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        isAuthenticated: true,
        user: mockUser
      });

      render(<AuthButton />);

      const userInfo = screen.getByTestId('auth-button-user-info');
      expect(userInfo).toHaveClass('auth-button__user-info');
    });

    it('should apply correct CSS classes for error display', () => {
      // Positive test case: CSS class validation for error
      mockUseAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Test error'
      });

      render(<AuthButton />);

      const errorElement = screen.getByTestId('auth-button-error');
      expect(errorElement).toHaveClass('auth-button__error');
    });
  });
});