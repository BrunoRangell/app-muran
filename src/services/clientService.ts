
import { supabase } from "@/lib/supabase";
import { ClientFormData } from "@/types/client";
import { parseCurrencyToNumber } from "@/utils/formatters";

interface ClientData {
  company_name: string;
  contract_value: number;
  first_payment_date: string;
  payment_type: "pre" | "post";
  status: "active" | "inactive";
  acquisition_channel: string;
  company_birthday: string | null;
  contact_name: string;
  contact_phone: string;
  last_payment_date: string | null;
}

export const verifySession = async () => {
  console.log("=== VERIFICAÇÃO DA SESSÃO ===");
  const startTime = performance.now();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log("Tempo de verificação:", `${performance.now() - startTime}ms`);
    
    if (error || !session) {
      console.error("Erro de sessão:", error);
      return { 
        success: false, 
        error: "Sessão expirada. Por favor, faça login novamente." 
      };
    }

    return { success: true, session };
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return { 
      success: false, 
      error: "Erro ao verificar sessão" 
    };
  }
};

export const prepareClientData = async (formData: ClientFormData): Promise<ClientData> => {
  console.log("Preparando dados para salvar:", formData);
  
  const contractValue = parseCurrencyToNumber(String(formData.contractValue));
  
  if (isNaN(contractValue) || contractValue <= 0) {
    throw new Error("Valor do contrato inválido");
  }

  const clientData = {
    company_name: formData.companyName,
    contract_value: contractValue,
    first_payment_date: formData.firstPaymentDate,
    payment_type: formData.paymentType,
    status: formData.status,
    acquisition_channel: formData.acquisitionChannel === "outro" 
      ? formData.customAcquisitionChannel 
      : formData.acquisitionChannel,
    company_birthday: formData.companyBirthday || null,
    contact_name: formData.contactName || "",
    contact_phone: formData.contactPhone || "",
    last_payment_date: formData.status === "inactive" 
      ? formData.lastPaymentDate || null
      : null,
  };

  console.log("Dados preparados:", clientData);
  return clientData;
};

export const saveClient = async (clientData: ClientData, clientId?: string) => {
  console.log("=== INICIANDO SALVAMENTO DO CLIENTE ===");
  console.log("Dados a serem salvos:", { clientData, clientId });
  const startTime = performance.now();

  try {
    let response;
    
    if (clientId) {
      response = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single();
    } else {
      response = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();
    }

    const { data, error } = response;
    console.log("Resposta do Supabase:", { data, error });
    console.log("Tempo de resposta:", `${performance.now() - startTime}ms`);

    if (error) {
      console.error("Erro ao salvar cliente:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro na operação:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao salvar cliente" 
    };
  }
};
