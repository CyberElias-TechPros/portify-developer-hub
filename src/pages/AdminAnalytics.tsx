import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";

type AnalyticsResponse = {
  rangeDays: number;
  totalVisitors: number;
  pageViews: number;
  daily: Array<{ date: string; page_views: number }>;
  pages: Array<{ name: string; views: number }>;
  devices: Array<{ name: string; users: number }>;
  referrers: Array<{ name: string; value: number }>;
};

const colours = ["#7c3aed", "#059669", "#f59e0b", "#2563eb", "#dc2626"];
function number(value: unknown) { return typeof value === "number" ? value : Number(value) || 0; }

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [range, setRange] = useState("7days");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const result = await api.request<AnalyticsResponse>(`/analytics?range=${range}`);
    if (result.error) {
      setError(true);
      toast({ title: "Could not load analytics", description: result.error.message, variant: "destructive" });
    } else if (result.data) {
      setData(result.data);
    }
    setLoading(false);
  }, [range, toast]);

  useEffect(() => { void load(); }, [load]);

  const daily = useMemo(() => (data?.daily ?? []).map((item) => ({ name: item.date, "Page views": number(item.page_views) })), [data]);
  const pages = useMemo(() => (data?.pages ?? []).map((item) => ({ name: item.name, views: number(item.views) })), [data]);
  const devices = useMemo(() => (data?.devices ?? []).map((item) => ({ name: item.name, users: number(item.users) })), [data]);
  const referrers = useMemo(() => (data?.referrers ?? []).map((item) => ({ name: item.name, value: number(item.value) })), [data]);

  const exportReport = () => {
    if (!data) return;
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Range days", String(data.rangeDays)],
      ["Unique visitors", String(data.totalVisitors)],
      ["Page views", String(data.pageViews)],
      [],
      ["Date", "Page views"],
      ...daily.map((item) => [item.name, String(item["Page views"])]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `portify-analytics-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-muted-foreground">Review page-view events collected by the Portify Worker.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs value={range} onValueChange={setRange}>
              <TabsList aria-label="Analytics date range">
                <TabsTrigger value="7days">7 days</TabsTrigger>
                <TabsTrigger value="30days">30 days</TabsTrigger>
                <TabsTrigger value="90days">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={exportReport} disabled={!data}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading analytics</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold">Analytics are temporarily unavailable</h2>
              <Button className="mt-5" onClick={() => void load()}>Try again</Button>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique visitors</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{number(data.totalVisitors).toLocaleString()}</p><p className="text-xs text-muted-foreground">Approximate by country and device</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Page views</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{number(data.pageViews).toLocaleString()}</p><p className="text-xs text-muted-foreground">Last {data.rangeDays} days</p></CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Page views over time</CardTitle><CardDescription>Daily page-view events in the selected period.</CardDescription></CardHeader>
                <CardContent><div className="h-[300px]">{daily.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="Page views" fill="#7c3aed" /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-muted-foreground">No page views recorded.</div>}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Devices</CardTitle><CardDescription>Device categories sent with page-view events.</CardDescription></CardHeader>
                <CardContent><div className="h-[300px]">{devices.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={devices} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" /><Tooltip /><Bar dataKey="users" fill="#059669" /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-muted-foreground">No device data recorded.</div>}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top pages</CardTitle><CardDescription>Paths with the most page views.</CardDescription></CardHeader>
                <CardContent><div className="h-[300px]">{pages.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={pages} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={100} /><Tooltip /><Bar dataKey="views" fill="#2563eb" /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-muted-foreground">No page data recorded.</div>}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Referrers</CardTitle><CardDescription>Where page-view requests reported coming from.</CardDescription></CardHeader>
                <CardContent><div className="h-[300px]">{referrers.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={referrers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{referrers.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={colours[index % colours.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-muted-foreground">No referrer data recorded.</div>}</div></CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
