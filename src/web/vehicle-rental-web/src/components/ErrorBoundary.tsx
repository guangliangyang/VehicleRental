import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from '../styles/ErrorBoundary.module.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorContainer} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">
            😞
          </span>

          <h2 className={styles.errorTitle}>
            Oops! Something went wrong
          </h2>

          <p className={styles.errorMessage}>
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>

          <div className={styles.buttonContainer}>
            <button
              onClick={this.handleRetry}
              className={styles.retryButton}
              aria-label="Try to recover from error"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className={styles.refreshButton}
              aria-label="Reload the page"
            >
              Refresh Page
            </button>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className={styles.errorDetails}>
              <summary className={styles.errorDetailsSummary}>
                Error Details (Development)
              </summary>

              <div className={styles.errorDetailsSection}>
                <div className={styles.errorDetailsLabel}>Error:</div>
                {this.state.error.message}
              </div>

              <div className={styles.errorDetailsSection}>
                <div className={styles.errorDetailsLabel}>Stack Trace:</div>
                <pre className={styles.errorDetailsCode}>
                  {this.state.error.stack}
                </pre>
              </div>

              {this.state.errorInfo && (
                <div className={styles.errorDetailsSection}>
                  <div className={styles.errorDetailsLabel}>Component Stack:</div>
                  <pre className={styles.errorDetailsCode}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use with hooks
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div role="alert" className={styles.fallbackContainer}>
    <h2 className={styles.fallbackTitle}>
      Something went wrong
    </h2>

    <p className={styles.fallbackMessage}>
      {error.message}
    </p>

    <button
      onClick={resetError}
      className={styles.fallbackButton}
      aria-label="Try to recover from error"
    >
      Try again
    </button>
  </div>
);

export default ErrorBoundary;