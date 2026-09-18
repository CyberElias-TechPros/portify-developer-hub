import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time failures so a single broken panel can never blank the
 * whole app. Shows a cinematic fallback with a recovery action.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[portify] render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--ink))] px-6">
        <div className="panel w-full max-w-lg p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10">
            <AlertTriangle className="h-5 w-5 text-amber-200" />
          </span>
          <h1 className="mt-5 font-display text-xl font-semibold">Something interrupted the render</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The page hit an unexpected error. Reloading usually clears it — if it keeps happening, the details below
            help us fix it fast.
          </p>
          <pre className="mt-5 max-h-40 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-left font-mono text-[11px] text-rose-200">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-5 py-2.5 text-sm font-semibold text-[hsl(240_30%_4%)]"
            >
              Reload page
            </button>
            <a
              href="/"
              className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-medium text-foreground/90"
            >
              Back home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
