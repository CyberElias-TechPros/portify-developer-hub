import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Github, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { ErrorNote, GhostButton, GlowButton, Panel, fieldClasses } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/api/client';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

const highlights = [
  'Claim your handle in seconds',
  'Starter sections, theme and résumé provisioned',
  'Import projects straight from GitHub',
  'Analytics, reactions and followers built in',
];

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword, signInWithProvider, refreshProfile } = useAuth();

  const [mode, setMode] = useState<Mode>((params.get('mode') as Mode) || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const requested = params.get('mode') as Mode | null;
    if (requested && ['login', 'register', 'forgot', 'reset'].includes(requested)) setMode(requested);
  }, [params]);

  useEffect(() => {
    if (user) navigate('/profile', { replace: true });
  }, [user, navigate]);

  const title = useMemo(
    () =>
      ({
        login: 'Welcome back',
        register: 'Create your studio',
        forgot: 'Reset your password',
        reset: 'Choose a new password',
      }[mode]),
    [mode]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) throw new Error(signInError.message);
        toast.success('Signed in — welcome back');
        navigate('/profile');
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Use at least 8 characters for your password');
        if (username && !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
          throw new Error('Handles use 3–30 letters, numbers, dashes or underscores');
        }
        const { error: signUpError } = await signUp(email.trim(), password, {
          full_name: fullName || undefined,
          username: username || undefined,
        });
        if (signUpError) throw new Error(signUpError.message);
        await refreshProfile();
        toast.success('Studio created — let’s build something');
        navigate('/profile');
      } else if (mode === 'forgot') {
        const { error: resetError } = await resetPassword(email.trim());
        if (resetError) throw new Error(resetError.message);
        setNotice('If that address exists, a reset link is on its way.');
      } else {
        const token = params.get('token');
        if (!token) throw new Error('This reset link is missing its token');
        const { error: resetError } = await auth.resetPassword(token, password);
        if (resetError) throw new Error(resetError.message);
        toast.success('Password updated — sign in to continue');
        setMode('login');
      }
    } catch (caught: any) {
      setError(caught?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideAnimation bare>
      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-16 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ------------------------------------------------------- narrative -- */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                portify studio
              </span>
            </span>
            <h1 className="display-lg max-w-[14ch]">
              Make your work <span className="text-gradient">impossible to ignore.</span>
            </h1>
            <ul className="mt-10 space-y-4">
              {highlights.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="panel mt-14 max-w-md p-6"
          >
            <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">demo account</p>
            <p className="mt-3 text-sm text-foreground/85">
              <span className="mono text-secondary">elias@portify.dev</span> ·{' '}
              <span className="mono text-secondary">demo1234</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              A fully populated admin studio — projects, writing, analytics and inbox included.
            </p>
            <GhostButton
              type="button"
              className="mt-4"
              onClick={() => {
                setMode('login');
                setEmail('elias@portify.dev');
                setPassword('demo1234');
              }}
            >
              Fill demo credentials
            </GhostButton>
          </motion.div>
        </div>

        {/* ------------------------------------------------------------ form -- */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{ perspective: 1200 }}
        >
          <Panel className="p-8">
            <div className="mb-8 flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {(['login', 'register'] as Mode[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMode(tab);
                    setError(null);
                  }}
                  className={`relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    mode === tab || (tab === 'login' && (mode === 'forgot' || mode === 'reset'))
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {(mode === tab || (tab === 'login' && (mode === 'forgot' || mode === 'reset'))) && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.07]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{tab === 'login' ? 'Sign in' : 'Create account'}</span>
                </button>
              ))}
            </div>

            <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login' && 'Your studio is exactly where you left it.'}
              {mode === 'register' && 'Thirty seconds from now you will have a live handle.'}
              {mode === 'forgot' && 'We will email you a secure reset link.'}
              {mode === 'reset' && 'Pick something strong — at least 8 characters.'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <AnimatePresence mode="popLayout">
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Full name"
                        className={fieldClasses('pl-11')}
                      />
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        @
                      </span>
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value.toLowerCase())}
                        placeholder="handle (optional)"
                        className={fieldClasses('pl-11')}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.dev"
                  className={fieldClasses('pl-11')}
                />
              </div>

              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className={fieldClasses('pl-11')}
                  />
                </div>
              )}

              <ErrorNote message={error} />
              {notice && (
                <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
                  {notice}
                </p>
              )}

              <GlowButton type="submit" disabled={loading} className="w-full py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === 'login' && 'Sign in'}
                {mode === 'register' && 'Create my studio'}
                {mode === 'forgot' && 'Send reset link'}
                {mode === 'reset' && 'Update password'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </GlowButton>
            </form>

            {mode === 'login' && (
              <>
                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="space-y-3">
                  <GhostButton type="button" className="w-full" onClick={() => signInWithProvider('github')}>
                    <Github className="h-4 w-4" /> Continue with GitHub
                  </GhostButton>
                </div>
              </>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              {mode === 'login' ? (
                <button onClick={() => setMode('forgot')} className="underline-sweep hover:text-foreground">
                  Forgot password?
                </button>
              ) : (
                <button onClick={() => setMode('login')} className="underline-sweep hover:text-foreground">
                  Back to sign in
                </button>
              )}
              <Link to="/discover" className="underline-sweep hover:text-foreground">
                Explore first
              </Link>
            </div>
          </Panel>
        </motion.div>
      </div>
    </Layout>
  );
}
