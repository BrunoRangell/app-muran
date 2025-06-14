
import { UnifiedLoading } from "@/components/common/UnifiedLoading";

export const DashboardLoadingState = () => {
  return (
    <div className="space-y-6">
      <UnifiedLoading 
        message="Carregando dashboard..."
        size="lg"
        variant="default"
        className="min-h-[200px]"
      />
    </div>
  );
};
