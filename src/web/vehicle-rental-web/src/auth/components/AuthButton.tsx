import React from 'react';
import { useAuth } from '../AuthContext';
import { getDisplayRole } from '../roleUtils';

export interface AuthButtonProps {
  className?: string;
  loginText?: string;
  logoutText?: string;
  loadingText?: string;
  showUserInfo?: boolean;
  showUserRole?: boolean;
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
  showUserRole = true,
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
        className={`btn btn-secondary ${className}`}
        data-testid="auth-button-loading"
      >
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        {loadingText}
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className={`d-flex align-items-center gap-3 flex-wrap ${className}`} data-testid="auth-button-authenticated">
        {showUserInfo && user && (
          <div className="d-flex flex-column align-items-end">
            <span
              className="fw-bold text-dark"
              data-testid="auth-button-user-info"
              style={{ fontSize: '14px' }}
            >
              Welcome, {user.name}
            </span>
            {showUserRole && (
              <span
                className="badge bg-light text-muted small mt-1"
                data-testid="auth-button-user-role"
              >
                {getDisplayRole(user)}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="btn btn-danger btn-sm"
          data-testid="auth-button-logout"
        >
          {logoutText}
        </button>
        {error && (
          <div
            className="alert alert-danger py-1 px-2 mb-0 small"
            data-testid="auth-button-error"
            style={{ maxWidth: '200px' }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center gap-3 flex-wrap ${className}`} data-testid="auth-button-unauthenticated">
      <button
        onClick={handleLogin}
        className="btn btn-primary btn-sm"
        data-testid="auth-button-login"
      >
        {loginText}
      </button>
      {error && (
        <div
          className="alert alert-danger py-1 px-2 mb-0 small"
          data-testid="auth-button-error"
          style={{ maxWidth: '200px' }}
        >
          {error}
        </div>
      )}
    </div>
  );
};