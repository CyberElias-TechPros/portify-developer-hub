
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingState from "./components/LoadingState";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Projects = lazy(() => import("./pages/Projects"));
const Skills = lazy(() => import("./pages/Skills"));
const Experience = lazy(() => import("./pages/Experience"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMessages = lazy(() => import("./pages/Messages"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const BlogCreate = lazy(() => import("./pages/BlogCreate"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Blog = lazy(() => import("./pages/Blog"));
const ThemeCustomizer = lazy(() => import("./pages/ThemeCustomizer"));
const ResumeEditor = lazy(() => import("./pages/ResumeEditor"));
const PortfolioSections = lazy(() => import("./pages/PortfolioSections"));
const UserPortfolio = lazy(() => import("./pages/UserPortfolio"));
const Community = lazy(() => import("./pages/Community"));
const Discover = lazy(() => import("./pages/Discover"));
const Help = lazy(() => import("./pages/Help"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/new" element={<BlogCreate />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/theme-customizer" element={<ThemeCustomizer />} />
            <Route path="/resume" element={<ResumeEditor />} />
            <Route path="/sections" element={<PortfolioSections />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/community" element={<Community />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/help" element={<Help />} />
            <Route path="/u/:username" element={<UserPortfolio />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
