
import { Skeleton } from "@/components/ui/skeleton";

export const ProjectCardSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
};

export const BlogPostSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[240px] w-full rounded-xl" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
};

export const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
