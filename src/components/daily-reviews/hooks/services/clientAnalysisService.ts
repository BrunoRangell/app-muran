import { supabase } from "@/integrations/supabase/client";

export const fetchClientAnalysis = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from("client_analysis")
      .select("*")
      .eq("client_id", clientId)
      .single();

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
    const { data, error } = await supabase
      .from("client_analysis")
      .upsert(
        {
          client_id: clientId,
          ...analysisData,
        },
        { onConflict: "client_id" }
      )
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
