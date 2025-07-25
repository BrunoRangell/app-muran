
import { supabase } from "@/integrations/supabase/client";

export const fetchClientAnalysis = async (clientId: string) => {
  try {
    // Como não existe a tabela client_analysis, vamos buscar nos system_logs
    const { data, error } = await supabase
      .from("system_logs")
      .select("*")
      .eq("event_type", "client_analysis")
      .or(`details->>'client_id'.eq.${clientId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar análise do cliente:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar análise do cliente:", error);
    return null;
  }
};

export const updateClientAnalysis = async (
  clientId: string,
  analysisData: any
) => {
  try {
    // Salvar análise como log do sistema
    const { data, error } = await supabase
      .from("system_logs")
      .insert({
        event_type: "client_analysis",
        message: `Análise do cliente ${clientId} atualizada`,
        details: {
          client_id: clientId,
          ...analysisData,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar análise do cliente:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao atualizar análise do cliente:", error);
    return null;
  }
};
