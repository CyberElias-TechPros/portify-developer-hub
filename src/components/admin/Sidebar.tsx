
import { BookOpen, Briefcase, Home, Info, LayoutDashboard, LogOut, MessageSquare, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/admin" 
    },
    { 
      icon: Info, 
      label: "Profile", 
      path: "/admin/profile" 
    },
    { 
      icon: Briefcase, 
      label: "Projects", 
      path: "/admin/projects" 
    },
    { 
      icon: User, 
      label: "Skills", 
      path: "/admin/skills" 
    },
    { 
      icon: BookOpen, 
      label: "Experience", 
      path: "/admin/experience" 
    },
    { 
      icon: MessageSquare, 
      label: "Messages", 
      path: "/admin/messages" 
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/admin/settings" 
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin" && location.pathname === "/admin") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/admin";
  };

  return (
    <div className="min-h-screen w-64 border-r bg-secondary/20 flex flex-col">
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-primary">Portify</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            View Site
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
