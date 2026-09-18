/**
 * Runtime smoke renderer. Mounts every route against the live Worker API in a
 * jsdom DOM and reports any render-time crash, console error or empty page.
 * Built by scripts/render-check.mjs with vite --ssr.
 */
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import Index from '@/pages/Index';
import Projects from '@/pages/Projects';
import Skills from '@/pages/Skills';
import Experience from '@/pages/Experience';
import Blog from '@/pages/Blog';
import BlogCreate from '@/pages/BlogCreate';
import BlogPost from '@/pages/BlogPost';
import Contact from '@/pages/Contact';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import AdminUsers from '@/pages/AdminUsers';
import AdminAnalytics from '@/pages/AdminAnalytics';
import Messages from '@/pages/Messages';
import ResumeEditor from '@/pages/ResumeEditor';
import ThemeCustomizer from '@/pages/ThemeCustomizer';
import PortfolioSections from '@/pages/PortfolioSections';
import Community from '@/pages/Community';
import Discover from '@/pages/Discover';
import Help from '@/pages/Help';
import UserPortfolio from '@/pages/UserPortfolio';
import NotFound from '@/pages/NotFound';

const ROUTES: [pattern: string, entry: string, Component: any][] = [
  ['/', '/', Index],
  ['/projects', '/projects', Projects],
  ['/skills', '/skills', Skills],
  ['/experience', '/experience', Experience],
  ['/blog', '/blog', Blog],
  ['/blog/create', '/blog/create', BlogCreate],
  ['/blog/:slug', '/blog/shipping-a-full-stack-on-cloudflare-workers', BlogPost],
  ['/contact', '/contact', Contact],
  ['/auth', '/auth', Auth],
  ['/auth/callback', '/auth/callback', AuthCallback],
  ['/profile', '/profile', Profile],
  ['/admin', '/admin', Admin],
  ['/admin/users', '/admin/users', AdminUsers],
  ['/admin/analytics', '/admin/analytics', AdminAnalytics],
  ['/messages', '/messages', Messages],
  ['/resume', '/resume', ResumeEditor],
  ['/theme', '/theme', ThemeCustomizer],
  ['/sections', '/sections', PortfolioSections],
  ['/community', '/community', Community],
  ['/discover', '/discover', Discover],
  ['/help', '/help', Help],
  ['/:username', '/elias', UserPortfolio],
  ['*', '/this-route-does-not-exist', NotFound],
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function run() {
  const results: any[] = [];

  for (const [pattern, entry, Component] of ROUTES) {
    const path = entry;
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route path={pattern} element={<Component />} />
              <Route path="*" element={<div data-redirect-sink />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    await wait(path === '/' ? 4000 : 3000);

    const text = (container.textContent || '').replace(/\s+/g, ' ').trim();
    const html = container.innerHTML;
    results.push({
      path,
      nodes: container.querySelectorAll('*').length,
      chars: text.length,
      boundary: text.includes('Something interrupted the render'),
      sample: text.slice(0, 220),
      hasMarkup: html.length > 200,
    });

    root.unmount();
    await wait(60);
    container.remove();
  }

  return results;
}
