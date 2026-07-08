import React, { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    eventId: null,
  };

  public static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo as any);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, eventId: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-400" size={32} />
            </div>

            <h1 className="text-xl font-semibold text-slate-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected application error has occurred. Our team has been notified.
            </p>

            {this.state.eventId && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 mb-6 text-left">
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                  Error reference ID
                </span>
                <code className="text-xs font-mono text-violet-400 break-all select-all">
                  {this.state.eventId}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-[#534AB7] hover:bg-[#433b9f] text-white text-sm font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
