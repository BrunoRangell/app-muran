
import { UnifiedLoadingState } from "@/components/common/UnifiedLoadingState";

export const ImprovedLoadingState = () => {
  return (
    <UnifiedLoadingState 
      message="Carregando dados das revisões..."
      size="lg"
      variant="spinner"
      className="min-h-[400px]"
    />
  );
};
