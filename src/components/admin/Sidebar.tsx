import { BookOpen, Briefcase, FileText, Home, LayoutDashboard, LogOut, MessageSquare, Settings, User, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const menuItems = [{ icon: LayoutDashboard, label: "Overview", path: "/admin" }, { icon: User, label: "Profile", path: "/profile" }, { icon: Briefcase, label: "Projects", path: "/projects" }, { icon: FileText, label: "Resume", path: "/resume" }, { icon: BookOpen, label: "Blog", path: "/blog" }, { icon: MessageSquare, label: "Messages", path: "/messages" }, { icon: Users, label: "Users", path: "/admin/users" }, { icon: BarChart3, label: "Analytics", path: "/admin/analytics" }, { icon: Settings, label: "Portfolio sections", path: "/sections" }];

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const active = (path: string) => path === "/admin" ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
  return <aside className="flex w-14 sm:w-16 md:w-64 shrink-0 min-h-screen border-r bg-secondary/20 flex-col"><div className="p-4 border-b"><Link to="/" className="flex items-center justify-center md:justify-start gap-2"><span className="font-bold text-xl text-primary">P<span className="hidden md:inline">ortify</span></span><span className="hidden md:inline text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span></Link></div><nav className="flex-1 p-2 md:p-4" aria-label="Admin navigation"><ul className="space-y-1">{menuItems.map(({ icon: Icon, label, path }) => <li key={path}><Link to={path} title={label} aria-current={active(path) ? "page" : undefined} className={`flex items-center justify-center md:justify-start gap-3 rounded-md px-3 py-2 transition-colors ${active(path) ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="hidden md:inline">{label}</span></Link></li>)}</ul></nav><div className="p-2 md:p-4 border-t space-y-1"><Button variant="ghost" className="w-full justify-center md:justify-start" asChild><Link to="/"><Home className="md:mr-2 h-4 w-4" aria-hidden="true" /><span className="hidden md:inline">View site</span></Link></Button><Button type="button" variant="ghost" className="w-full justify-center md:justify-start text-destructive" onClick={() => void (async () => { const result = await signOut(); if (result.error) toast({ title: "Could not sign out", description: result.error.message, variant: "destructive" }); else window.location.assign("/"); })()}><LogOut className="md:mr-2 h-4 w-4" aria-hidden="true" /><span className="hidden md:inline">Sign out</span></Button></div></aside>;
}
