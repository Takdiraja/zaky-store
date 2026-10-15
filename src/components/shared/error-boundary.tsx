"use client";

import { Component, type ReactNode } from "react";
import ErrorState from "./error-state";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-level error boundary: catches render errors and shows a friendly
 * Indonesian error state with a retry button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16">
          <ErrorState
            title="Terjadi kesalahan"
            description="Maaf, terjadi kendala saat menampilkan halaman. Silakan coba lagi."
            onRetry={this.handleRetry}
            retryLabel="Muat Ulang"
          />
        </div>
      );
    }
    return this.props.children;
  }
}
