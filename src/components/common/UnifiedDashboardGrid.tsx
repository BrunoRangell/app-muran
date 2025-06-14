
import { ReactNode } from "react";

interface UnifiedDashboardGridProps {
  children: ReactNode;
  variant?: 'metrics' | 'cards' | 'sections';
  className?: string;
}

export function UnifiedDashboardGrid({ 
  children, 
  variant = 'metrics',
  className = ""
}: UnifiedDashboardGridProps) {
  const getGridClasses = () => {
    switch (variant) {
      case 'metrics':
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
      case 'cards':
        return "grid grid-cols-1 lg:grid-cols-2 gap-6";
      case 'sections':
        return "grid grid-cols-1 xl:grid-cols-2 gap-8";
      default:
        return "grid gap-6";
    }
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
}
