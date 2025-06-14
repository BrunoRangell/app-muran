
import { lazy, Suspense, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyComponentProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}

export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentProps = {}
) {
  const LazyComp = lazy(importFn);

  return function LazyWrapper(props: T) {
    const fallback = options.fallback || (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );

    return (
      <Suspense fallback={fallback}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

// Componentes lazy para componentes pesados
export const LazyMetricsChart = createLazyComponent(
  () => import("@/components/clients/metrics/MetricsChart").then(module => ({ default: module.MetricsChart }))
);

export const LazyPaymentsTable = createLazyComponent(
  () => import("@/components/payments/PaymentsTable").then(module => ({ default: module.PaymentsTable }))
);

export const LazyFinancialReport = createLazyComponent(
  () => import("@/pages/FinancialReport").then(module => ({ default: module.default }))
);
