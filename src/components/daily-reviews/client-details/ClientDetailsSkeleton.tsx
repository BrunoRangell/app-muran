
import { Skeleton } from "@/components/ui/skeleton";

export const ClientDetailsSkeleton = () => {
  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center">
          <Skeleton className="h-9 w-24 mr-2" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-5 w-full" />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
};
