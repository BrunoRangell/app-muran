
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useClientAnalysis = (onSuccess: (data: any) => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation para analisar cliente específico
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log("Iniciando análise para o cliente:", clientId);
      
      // Buscar informações do cliente para validação
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (clientError || !client) {
        throw new Error("Cliente não encontrado");
      }
      
      if (!client.meta_account_id) {
        toast({
          title: "Configuração incompleta",
          description: "O cliente não possui um ID de conta Meta configurado. Por favor, configure-o primeiro.",
          variant: "destructive",
        });
        throw new Error("O cliente não possui um ID de conta Meta configurado");
      }
      
      if (!client.meta_ads_budget || client.meta_ads_budget <= 0) {
        toast({
          title: "Configuração incompleta",
          description: "O cliente não possui um orçamento Meta Ads configurado. Por favor, configure-o primeiro.",
          variant: "destructive",
        });
        throw new Error("O cliente não possui um orçamento Meta Ads configurado");
      }
      
      console.log("Chamando função Edge para análise do cliente:", client);
      
      try {
        // Verificar se estamos em ambiente de desenvolvimento para simular resposta
        if (import.meta.env.DEV) {
          console.log("Ambiente de desenvolvimento detectado - simulando resposta da função Edge");
          
          // Simular um atraso para dar feedback visual
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Criar uma revisão simulada no banco de dados
          const today = new Date().toISOString().split('T')[0];
          
          const { data: existingReview, error: checkError } = await supabase
            .from("daily_budget_reviews")
            .select("id")
            .eq("client_id", clientId)
            .eq("review_date", today)
            .maybeSingle();
            
          if (checkError) {
            console.error("Erro ao verificar revisão existente:", checkError);
          }
          
          // Se já existe uma revisão para hoje, atualizamos, senão inserimos uma nova
          let reviewId;
          
          if (existingReview) {
            console.log("Atualizando revisão existente para hoje");
            const { data, error } = await supabase
              .from("daily_budget_reviews")
              .update({
                meta_daily_budget_current: client.meta_ads_budget / 30, // Simplificação para o exemplo
                meta_total_spent: client.meta_ads_budget * 0.7, // Simula 70% do orçamento gasto
                updated_at: new Date().toISOString()
              })
              .eq("id", existingReview.id)
              .select();
              
            if (error) throw error;
            reviewId = existingReview.id;
          } else {
            console.log("Criando nova revisão");
            const { data, error } = await supabase
              .from("daily_budget_reviews")
              .insert({
                client_id: clientId,
                review_date: today,
                meta_daily_budget_current: client.meta_ads_budget / 30,
                meta_total_spent: client.meta_ads_budget * 0.7,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select();
              
            if (error) throw error;
            reviewId = data?.[0]?.id;
          }
          
          return {
            status: "success",
            message: "Análise simulada concluída com sucesso",
            client: client,
            reviewId: reviewId
          };
        }
        
        // Em produção, chama a função Edge real
        const response = await supabase.functions.invoke("daily-budget-reviews", {
          body: { method: "analyzeClient", clientId },
        });

        console.log("Resposta da função Edge:", response);
        
        if (response.error) {
          console.error("Erro retornado pela função Edge:", response.error);
          throw new Error(response.error.message || "Erro na análise");
        }
        
        return response.data;
      } catch (error: any) {
        console.error("Erro ao chamar função Edge:", error);
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
