
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateClient } from "./useClientValidation";
import { simulateClientAnalysis } from "./useDevSimulation";
import { callEdgeFunction } from "./useEdgeFunction";

export const useClientAnalysis = (onSuccess: (data: any) => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation para analisar cliente específico
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log("Iniciando análise para o cliente:", clientId);
      
      try {
        // 1. Validar o cliente
        const client = await validateClient(clientId);
        
        console.log("Chamando função para análise do cliente:", client);
        
        // 2. Verificar se estamos em ambiente de desenvolvimento para simular resposta
        if (import.meta.env.DEV) {
          console.log("Ambiente de desenvolvimento detectado - simulando resposta da função Edge");
          return await simulateClientAnalysis(clientId, client);
        }
        
        // 3. Em produção, chama a função Edge real
        return await callEdgeFunction(clientId);
        
      } catch (error: any) {
        console.error("Erro ao chamar função de análise:", error);
        toast({
          title: "Erro na análise",
          description: String(error?.message || error),
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Análise concluída com sucesso:", data);
      toast({
        title: "Análise concluída",
        description: `A análise para ${data.client?.company_name || 'o cliente'} foi atualizada com sucesso.`,
      });
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ["clients-active"] });
      queryClient.invalidateQueries({ queryKey: ["recent-reviews"] });
      
      // Chamar callback de sucesso
      onSuccess(data);
    },
    onError: (error: any) => {
      console.error("Erro detalhado na análise:", error);
      toast({
        title: "Erro na análise",
        description: String(error?.message || error),
        variant: "destructive",
      });
    },
  });

  return { analyzeMutation };
};
