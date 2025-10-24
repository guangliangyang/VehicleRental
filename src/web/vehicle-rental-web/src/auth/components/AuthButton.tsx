import React from 'react';
import { useAuth } from '../AuthContext';

export interface AuthButtonProps {
  className?: string;
  loginText?: string;
  logoutText?: string;
  loadingText?: string;
  showUserInfo?: boolean;
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
  onError?: (error: string) => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  className = '',
  loginText = 'Sign In',
  logoutText = 'Sign Out',
  loadingText = 'Loading...',
  showUserInfo = true,
  onLoginSuccess,
  onLogoutSuccess,
  onError
}) => {
  const { isAuthenticated, user, login, logout, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`auth-button auth-button--loading ${className}`}
        data-testid="auth-button-loading"
      >
        {loadingText}
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`auth-button-container ${className}`} data-testid="auth-button-authenticated">
        {showUserInfo && user && (
          <span
            className="auth-button__user-info"
            data-testid="auth-button-user-info"
          >
            Welcome, {user.name}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="auth-button auth-button--logout"
          data-testid="auth-button-logout"
        >
          {logoutText}
        </button>
        {error && (
          <div
            className="auth-button__error"
            data-testid="auth-button-error"
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`auth-button-container ${className}`} data-testid="auth-button-unauthenticated">
      <button
        onClick={handleLogin}
        className="auth-button auth-button--login"
        data-testid="auth-button-login"
      >
        {loginText}
      </button>
      {error && (
        <div
          className="auth-button__error"
          data-testid="auth-button-error"
        >
          {error}
        </div>
      )}
    </div>
  );
};