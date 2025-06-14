
import { UnifiedLoading } from "@/components/common/UnifiedLoading";

export const ClientsLoadingState = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 border">
          <UnifiedLoading 
            message=""
            size="sm"
            variant="default"
          />
        </div>
      ))}
    </div>
  );
};
