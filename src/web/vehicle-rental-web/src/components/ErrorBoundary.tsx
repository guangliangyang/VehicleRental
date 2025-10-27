import React, { Component, ErrorInfo, ReactNode } from 'react';

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
        <div className="alert alert-danger text-center m-4" role="alert">
          <div className="display-3 mb-3" aria-hidden="true">
            😞
          </div>

          <h2 className="h4 mb-3">
            Oops! Something went wrong
          </h2>

          <p className="mb-4">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>

          <div className="d-flex gap-2 justify-content-center mb-4">
            <button
              onClick={this.handleRetry}
              className="btn btn-primary"
              aria-label="Try to recover from error"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline-secondary"
              aria-label="Reload the page"
            >
              Refresh Page
            </button>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3 text-start">
              <summary className="fw-bold mb-2 text-muted">
                Error Details (Development)
              </summary>

              <div className="mb-3">
                <strong className="text-muted">Error:</strong>
                <div className="ms-2">{this.state.error.message}</div>
              </div>

              <div className="mb-3">
                <strong className="text-muted">Stack Trace:</strong>
                <pre className="bg-light p-2 rounded small text-dark mt-1" style={{fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto'}}>
                  {this.state.error.stack}
                </pre>
              </div>

              {this.state.errorInfo && (
                <div className="mb-3">
                  <strong className="text-muted">Component Stack:</strong>
                  <pre className="bg-light p-2 rounded small text-dark mt-1" style={{fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto'}}>
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
  <div role="alert" className="alert alert-danger text-center m-4">
    <h2 className="h5 mb-3">
      Something went wrong
    </h2>

    <p className="mb-3">
      {error.message}
    </p>

    <button
      onClick={resetError}
      className="btn btn-primary"
      aria-label="Try to recover from error"
    >
      Try again
    </button>
  </div>
);

export default ErrorBoundary;