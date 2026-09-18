import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Rss, ArrowUpRight } from 'lucide-react';
import { Reveal } from './experience/Reveal';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Discover people', href: '/discover' },
      { label: 'Community', href: '/community' },
      { label: 'Writing', href: '/blog' },
      { label: 'Projects', href: '/projects' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { label: 'Portfolio studio', href: '/sections' },
      { label: 'Theme studio', href: '/theme' },
      { label: 'Résumé builder', href: '/resume' },
      { label: 'Inbox', href: '/messages' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help centre', href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sign in', href: '/auth' },
      { label: 'Create account', href: '/auth?mode=register' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-white/10">
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_100%,hsl(var(--violet)/.22),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <Reveal mode="blur" className="mb-16">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <p className="eyebrow mb-4">Portify</p>
              <h2 className="display-lg">
                Your work deserves <span className="text-gradient">a stage.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                A portfolio platform for developers who care about craft — cinematic presentation, real data, zero
                templates you've seen a hundred times.
              </p>
            </div>
            <Link
              to="/auth?mode=register"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium transition-all duration-500 ease-cinematic hover:border-primary/50 hover:bg-primary/10"
            >
              Claim your handle
              <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-12 border-t border-white/10 pt-12 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--violet))] via-[hsl(var(--cyan))] to-[hsl(var(--amber))] font-display text-sm font-extrabold text-[hsl(240_30%_4%)]">
                P
              </span>
              <span className="font-display text-sm font-semibold">Portify</span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Built for developers. Hosted on the edge, rendered in milliseconds.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Rss, href: '/rss.xml', label: 'RSS' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="eyebrow mb-4">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="underline-sweep inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Portify. Crafted with obsessive attention to detail.</p>
          <p className="mono">
            edge-rendered · <span className="text-secondary">cloudflare workers</span> · d1
          </p>
        </div>
      </div>

      {/* oversized wordmark for depth */}
      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden text-center font-display text-[22vw] font-extrabold leading-none text-white/[0.028]"
      >
        PORTIFY
      </div>
    </footer>
  );
}
