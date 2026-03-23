/**
 * ErrorBoundary Component
 * Catches unhandled errors in child components and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log error to an external service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle className="text-red-600" size={48} />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6 text-sm">
              The application encountered an unexpected error.
              {this.state.error && (
                <>
                  {" "}
                  <br />
                  <span className="font-mono text-xs text-red-600 mt-2 block">
                    {this.state.error.toString()}
                  </span>
                </>
              )}
            </p>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mb-6 text-xs bg-gray-100 p-4 rounded border border-gray-200 max-h-48 overflow-y-auto">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap break-words text-gray-600">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition active:scale-95"
              >
                <Home size={16} />
                Go Home
              </button>
            </div>

            {/* Support Info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
