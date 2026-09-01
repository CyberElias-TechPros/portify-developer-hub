import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, File, MessageSquare, Wrench, Briefcase, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type DashboardData = { projects: number; skills: number; experiences: number; blogPosts: number; messages: number; unreadMessages: number };
type AnalyticsData = { pageViews: number; totalVisitors: number };

export default function DashboardStats() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    Promise.all([api.request<DashboardData>("/dashboard/stats"), api.request<AnalyticsData>("/analytics?range=30days")]).then(([dashboard, traffic]) => {
      if (!mounted) return;
      if (dashboard.error || traffic.error) toast({ title: "Could not load dashboard stats", description: dashboard.error?.message || traffic.error?.message, variant: "destructive" });
      if (dashboard.data) setStats(dashboard.data);
      if (traffic.data) setAnalytics(traffic.data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [toast]);
  const cards = [
    { label: "Portfolio views", value: analytics?.pageViews ?? 0, detail: `${analytics?.totalVisitors ?? 0} unique visitors in 30 days`, icon: Eye },
    { label: "Projects", value: stats?.projects ?? 0, detail: "Published and private records", icon: File },
    { label: "Skills", value: stats?.skills ?? 0, detail: "Skills in your portfolio", icon: Wrench },
    { label: "Experience", value: stats?.experiences ?? 0, detail: "Career entries", icon: Briefcase },
    { label: "Blog posts", value: stats?.blogPosts ?? 0, detail: "Posts and drafts", icon: BookOpen },
    { label: "Messages", value: stats?.messages ?? 0, detail: `${stats?.unreadMessages ?? 0} unread`, icon: MessageSquare },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{cards.map(({ label, value, detail, icon: Icon }) => <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><span className="text-2xl font-bold">{loading ? "—" : value.toLocaleString()}</span></div><p className="text-xs text-muted-foreground mt-1">{loading ? "Loading…" : detail}</p></CardContent></Card>)}</div>;
}
