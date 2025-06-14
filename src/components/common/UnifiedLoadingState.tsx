
import { UnifiedLoading } from "./UnifiedLoading";

// Componente para compatibilidade com código existente
export function UnifiedLoadingState({ message }: { message?: string }) {
  return (
    <UnifiedLoading 
      message={message}
      size="md"
      variant="default"
    />
  );
}
