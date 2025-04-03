
import { DashboardStatsSkeleton, ProjectCardSkeleton, ProfileSkeleton } from "@/components/ui/loading-skeleton";
import { useLocation } from "react-router-dom";

export default function LoadingState() {
  const location = useLocation();
  const path = location.pathname;

  // Render different skeletons based on current path
  if (path.includes('/admin/messages')) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border rounded-lg p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2 border-b pb-4">
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="md:col-span-2 border rounded-lg p-6">
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
              <div className="h-32 w-full bg-muted rounded animate-pulse mt-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path.includes('/admin')) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div>
            <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <ProfileSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (path.includes('/projects')) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="h-10 w-64 bg-muted rounded animate-pulse mx-auto"></div>
            <div className="h-5 w-96 bg-muted rounded animate-pulse mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (path.includes('/blog')) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="h-10 w-64 bg-muted rounded animate-pulse mx-auto"></div>
            <div className="h-5 w-96 bg-muted rounded animate-pulse mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default loading state for other pages
  return (
    <div className="w-full h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-16 w-16 rounded-full border-4 border-primary border-r-transparent animate-spin"></div>
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    </div>
  );
}
