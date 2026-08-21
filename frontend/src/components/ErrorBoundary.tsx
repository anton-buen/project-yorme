import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#F9F8F6] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white border border-rose-200 rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
                  Application Error
                </h1>
                <p className="text-sm text-slate-500" style={SANS}>
                  Something went wrong while rendering the dashboard
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-rose-900 mb-2" style={SANS}>
                Error Details:
              </p>
              <p className="text-sm text-rose-800 font-mono break-words">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="mb-6">
                <summary className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900 mb-2" style={SANS}>
                  Component Stack Trace
                </summary>
                <pre className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                style={SANS}
              >
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                style={SANS}
              >
                Try Again
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600 leading-relaxed" style={SANS}>
                <strong>Common causes:</strong> Missing or malformed incident data, undefined timeline properties, 
                or network issues. If this persists, check the browser console for detailed logs.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
