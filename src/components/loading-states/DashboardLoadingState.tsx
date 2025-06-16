
import { UnifiedLoadingState } from "@/components/common/UnifiedLoadingState";

export const DashboardLoadingState = () => {
  return (
    <div className="space-y-6 relative z-10">
      <UnifiedLoadingState 
        message="Carregando dashboard..."
        size="lg"
        variant="skeleton"
        className="min-h-[200px]"
      />
    </div>
  );
};
