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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '12px' }}>
            <span
              className="auth-button__user-info"
              data-testid="auth-button-user-info"
              style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
              Welcome, {user.name}
            </span>
            {showUserRole && (
              <span
                className="auth-button__user-role"
                data-testid="auth-button-user-role"
                style={{
                  fontSize: '12px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  marginTop: '2px'
                }}
              >
                {getDisplayRole(user)}
              </span>
            )}
          </div>
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