import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import Background from './experience/Background';
import ScrollProgress from './experience/ScrollProgress';
import CursorGlow from './experience/CursorGlow';
import { applyTheme, loadTheme } from '@/lib/theme';

interface LayoutProps {
  children: ReactNode;
  hideAnimation?: boolean;
  /** Full-bleed pages (portfolio, auth) skip the max-width chrome entirely. */
  bare?: boolean;
}

export default function Layout({ children, hideAnimation = false, bare = false }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    applyTheme(loadTheme());
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) applyTheme(detail);
    };
    window.addEventListener('portify:theme', onTheme);
    return () => window.removeEventListener('portify:theme', onTheme);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Background />
      <CursorGlow />
      <ScrollProgress />
      <Navbar />

      <main className={`relative z-10 flex-grow ${bare ? '' : 'pt-24'}`}>
        {hideAnimation ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Footer />
    </div>
  );
}
