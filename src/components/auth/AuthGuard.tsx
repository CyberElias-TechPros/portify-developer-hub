import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

function SessionUnavailable({ retry }: { retry: () => void }) {
  return (
    <div className="container py-20 text-center" role="alert">
      <h1 className="text-2xl font-bold">Your session could not be checked</h1>
      <p className="mt-2 text-muted-foreground">The API is temporarily unavailable. Your account has not been signed out.</p>
      <Button className="mt-5" onClick={retry}>Try again</Button>
    </div>
  );
}

function GuardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Checking your session</span>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (loading) return <GuardLoading />;
  if (sessionError) return <SessionUnavailable retry={retrySession} />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (loading) return <GuardLoading />;
  if (sessionError) return <SessionUnavailable retry={retrySession} />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (user.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Administrator access required</h1>
        <p className="mt-2 text-muted-foreground">Your account does not have permission to view this area.</p>
      </div>
    );
  }
  return <>{children}</>;
}
