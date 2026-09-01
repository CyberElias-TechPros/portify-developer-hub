import AdminLayout from "@/components/admin/Layout";
import DashboardStats from "@/components/admin/DashboardStats";
import RoleManagement from "@/components/admin/RoleManagement";
import SiteSettings from "@/components/admin/SiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Admin() {
  return <AdminLayout><div className="space-y-8"><div><h1 className="text-3xl font-bold">Admin dashboard</h1><p className="mt-1 text-muted-foreground">Monitor the deployment and manage the content and accounts you are authorized to administer.</p></div><DashboardStats /><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Workspace shortcuts</CardTitle><CardDescription>Go directly to the areas you use most.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Button variant="outline" asChild><Link to="/profile">Edit profile</Link></Button><Button variant="outline" asChild><Link to="/sections">Manage portfolio content</Link></Button><Button variant="outline" asChild><Link to="/theme">Customize portfolio theme</Link></Button><Button variant="outline" asChild><Link to="/messages">Review messages</Link></Button></CardContent></Card><Card><CardHeader><CardTitle>Roles and permissions</CardTitle><CardDescription>Access changes are validated server-side.</CardDescription></CardHeader><CardContent><RoleManagement /></CardContent></Card></div><SiteSettings /></div></AdminLayout>;
}
