import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home } from 'lucide-react';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton } from '@/components/ui-kit';

export default function NotFound() {
  return (
    <Layout>
      <section className="relative flex min-h-[70vh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-center"
        >
          <motion.p
            className="font-display text-[22vw] font-extrabold leading-none text-white/[0.05] md:text-[16vw]"
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.p>

          <div className="relative -mt-10">
            <p className="eyebrow mb-4">Lost in the void</p>
            <h1 className="display-lg">
              This page never <span className="text-gradient">shipped.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              The link is broken, the handle changed, or the work was unpublished. Either way — nothing to see here.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/">
                <GlowButton>
                  <Home className="h-4 w-4" /> Back to the landing page
                </GlowButton>
              </Link>
              <Link to="/discover">
                <GhostButton>
                  <Compass className="h-4 w-4" /> Discover developers
                </GhostButton>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
