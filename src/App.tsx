import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAdmin, RequireAuth } from "@/components/auth/AuthGuard";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index")); const Projects = lazy(() => import("./pages/Projects")); const Skills = lazy(() => import("./pages/Skills")); const Experience = lazy(() => import("./pages/Experience")); const Blog = lazy(() => import("./pages/Blog")); const BlogPost = lazy(() => import("./pages/BlogPost")); const BlogCreate = lazy(() => import("./pages/BlogCreate")); const Contact = lazy(() => import("./pages/Contact")); const Auth = lazy(() => import("./pages/Auth")); const ResetPassword = lazy(() => import("./pages/ResetPassword")); const Profile = lazy(() => import("./pages/Profile")); const NotFound = lazy(() => import("./pages/NotFound")); const Admin = lazy(() => import("./pages/Admin")); const AdminUsers = lazy(() => import("./pages/AdminUsers")); const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics")); const Messages = lazy(() => import("./pages/Messages")); const ResumeEditor = lazy(() => import("./pages/ResumeEditor")); const ThemeCustomizer = lazy(() => import("./pages/ThemeCustomizer")); const PortfolioSections = lazy(() => import("./pages/PortfolioSections")); const Community = lazy(() => import("./pages/Community")); const Discover = lazy(() => import("./pages/Discover")); const Help = lazy(() => import("./pages/Help")); const UserPortfolio = lazy(() => import("./pages/UserPortfolio"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    if (property) element.setAttribute("property", name); else element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function SiteMetadata() {
  useEffect(() => {
    let mounted = true;
    void api.request<Array<{ value: unknown }>>("/data/site_settings?eq_key=site_info&limit=1").then((result) => {
      if (!mounted) return;
      if (result.error) { if (result.error.code !== "PGRST116") console.warn("Site metadata is unavailable", result.error.message); return; }
      if (!result.data?.[0]?.value || typeof result.data[0].value !== "object" || Array.isArray(result.data[0].value)) return;
      const value = result.data[0].value as Record<string, unknown>;
      const title = typeof value.title === "string" ? value.title.trim() : "";
      const description = typeof value.description === "string" ? value.description.trim() : "";
      const keywords = typeof value.keywords === "string" ? value.keywords.trim() : "";
      const author = typeof value.author === "string" ? value.author.trim() : "";
      const logoUrl = typeof value.logoUrl === "string" ? value.logoUrl.trim() : "";
      if (title) { document.title = title; setMeta("og:title", title, true); }
      if (description) { setMeta("description", description); setMeta("og:description", description, true); }
      if (keywords) setMeta("keywords", keywords);
      if (author) setMeta("author", author);
      if (logoUrl) setMeta("og:image", logoUrl, true);
      const faviconUrl = typeof value.faviconUrl === "string" ? value.faviconUrl.trim() : "";
      if (faviconUrl) {
        let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
        icon.href = faviconUrl;
      }
    });
    return () => { mounted = false; };
  }, []);
  return null;
}

function RouteLoading() { return <div className="flex min-h-[60vh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading page</span></div>; }
function AnalyticsTracker() { const location = useLocation(); useEffect(() => { const key = `portify:view:${location.pathname}`; try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* Analytics remains optional when storage is unavailable. */ } void api.request("/analytics/pageview", { method: "POST", body: JSON.stringify({ pathname: location.pathname, referrer: document.referrer }) }); }, [location.pathname]); return null; }

export default function App() { return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><Toaster /><Sonner /><SiteMetadata /><BrowserRouter><AnalyticsTracker /><Suspense fallback={<RouteLoading />}><Routes><Route path="/" element={<Index />} /><Route path="/projects" element={<Projects />} /><Route path="/skills" element={<Skills />} /><Route path="/experience" element={<Experience />} /><Route path="/blog" element={<Blog />} /><Route path="/blog/create" element={<RequireAuth><BlogCreate /></RequireAuth>} /><Route path="/blog/:slug" element={<BlogPost />} /><Route path="/contact" element={<Contact />} /><Route path="/auth" element={<Auth />} /><Route path="/auth/reset-password" element={<ResetPassword />} /><Route path="/discover" element={<Discover />} /><Route path="/community" element={<Community />} /><Route path="/help" element={<Help />} /><Route path="/:username" element={<UserPortfolio />} /><Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} /><Route path="/resume" element={<RequireAuth><ResumeEditor /></RequireAuth>} /><Route path="/theme" element={<RequireAuth><ThemeCustomizer /></RequireAuth>} /><Route path="/sections" element={<RequireAuth><PortfolioSections /></RequireAuth>} /><Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} /><Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} /><Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} /><Route path="/messages" element={<RequireAdmin><Messages /></RequireAdmin>} /><Route path="*" element={<NotFound />} /></Routes></Suspense></BrowserRouter></TooltipProvider></AuthProvider></QueryClientProvider>; }
