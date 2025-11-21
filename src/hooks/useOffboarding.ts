import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OffboardingResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export const useOffboarding = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OffboardingResult | null>(null);

  const executeOffboarding = async (clientId: string, folderId?: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      console.log("🚀 Iniciando offboarding para cliente:", clientId, folderId ? `com pasta ${folderId}` : "");

      const { data, error } = await supabase.functions.invoke(
        "orchestrate-client-offboarding",
        {
          body: { 
            clientId,
            ...(folderId && { folderId }),
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Se precisa de seleção de pasta, retornar dados para o componente
      if (data.needsFolderSelection) {
        console.log("⚠️ Necessário selecionar pasta");
        setResult({
          success: false,
          data: {
            needsFolderSelection: true,
            folders: data.folders,
          },
        });
        setIsProcessing(false);
        return;
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao executar offboarding");
      }

      console.log("✅ Offboarding concluído:", data);

      setResult({
        success: true,
        message: data.message,
        data: data.data,
      });

      toast.success("Offboarding concluído com sucesso!");
    } catch (error: any) {
      console.error("❌ Erro no offboarding:", error);

      const errorMessage = error.message || "Erro ao executar offboarding";
      
      setResult({
        success: false,
        error: errorMessage,
      });

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetOffboarding = () => {
    setResult(null);
    setIsProcessing(false);
  };

  return {
    executeOffboarding,
    resetOffboarding,
    isProcessing,
    result,
  };
};
