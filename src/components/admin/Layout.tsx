
import { ReactNode } from "react";
import AdminSidebar from "./Sidebar";
import AdminHeader from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg">Skip to content</a>
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main id="admin-main-content" className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
