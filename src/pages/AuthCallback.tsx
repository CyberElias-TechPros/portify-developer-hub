import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, Panel } from '@/components/ui-kit';
import { auth } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Handles both OAuth redirects (`?token=…`) and email links that land here.
 */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }
    if (!token) {
      setError('This link is missing its sign-in token.');
      return;
    }
    void (async () => {
      const session = await auth.acceptOAuthToken(token);
      if (!session?.user) {
        setError('We could not verify that sign-in link. It may have expired.');
        return;
      }
      await refreshProfile();
      navigate('/profile', { replace: true });
    })();
  }, [params, navigate, refreshProfile]);

  return (
    <Layout hideAnimation>
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-6">
        <Panel className="w-full p-10 text-center">
          {error ? (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              </span>
              <h1 className="mt-5 font-display text-xl font-semibold">Sign-in failed</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <GlowButton onClick={() => navigate('/auth')}>Try again</GlowButton>
                <GhostButton onClick={() => navigate('/')}>Back home</GhostButton>
              </div>
            </>
          ) : (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10"
              >
                <Loader2 className="h-5 w-5 text-primary" />
              </motion.span>
              <h1 className="mt-5 font-display text-xl font-semibold">Completing sign-in</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Verifying your session and preparing your studio…
              </p>
            </>
          )}
        </Panel>
      </div>
    </Layout>
  );
}
