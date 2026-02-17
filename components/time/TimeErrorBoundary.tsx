/**
 * Error Boundary for the /time page
 *
 * Prevents white screen crashes by displaying a fallback UI
 * when prayer data fails to load or other errors occur.
 */

"use client";

import { Component, type ReactNode } from "react";

interface TimeErrorBoundaryProps {
  children: ReactNode;
}

interface TimeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TimeErrorBoundary extends Component<TimeErrorBoundaryProps, TimeErrorBoundaryState> {
  constructor(props: TimeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TimeErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development, Sentry in production
    console.error("TimeErrorBoundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
          <div className="text-center p-8">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">Prayer Times Unavailable</h1>
            <p className="text-xl lg:text-2xl text-slate-400 mb-8">
              Unable to load prayer times. Please refresh the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black rounded-lg text-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
