import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton discreto no formato da visão Lista. */
export const TaskListSkeleton = ({ groups = 3 }: { groups?: number }) => (
  <div className="space-y-5">
    {Array.from({ length: groups }).map((_, g) => (
      <div key={g}>
        <div className="flex items-center gap-2 px-1 py-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-[3px]" />
        </div>
        <div className="mt-1 overflow-hidden rounded-[4px] border border-border/70">
          {Array.from({ length: 3 }).map((__, r) => (
            <div key={r} className="flex items-center gap-3 border-b border-border/50 px-3 py-[9px] last:border-b-0">
              <Skeleton className="h-[15px] w-[15px] rounded-full" />
              <Skeleton className="h-3 flex-1 max-w-[320px]" />
              <Skeleton className="h-[22px] w-[22px] rounded-full" />
              <Skeleton className="h-3 w-[90px]" />
              <Skeleton className="h-3 w-[70px]" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Skeleton discreto no formato do Kanban. */
export const TaskBoardSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <div className="flex gap-3">
    {Array.from({ length: columns }).map((_, c) => (
      <div key={c} className="w-[280px] min-w-[280px] space-y-1.5">
        <Skeleton className="mb-2 h-6 w-32 rounded" />
        {Array.from({ length: 2 }).map((__, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
        ))}
      </div>
    ))}
  </div>
);

export const TasksTreeSkeleton = () => (
  <div className="space-y-1.5 px-1 py-1">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);
