
import { supabase } from "@/lib/supabase";
import { ClientFormData } from "@/types/client";
import { parseCurrencyToNumber } from "@/utils/formatters";

interface ClientData {
  company_name: string;
  contract_value: number;
  first_payment_date: string;
  payment_type: string;  // Alterado de "pre" | "post" para string
  status: string;  // Alterado de "active" | "inactive" para string
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
  
  if (isNaN(contractValue) || contractValue < 0) {
    throw new Error("Valor do contrato inválido: deve ser maior ou igual a zero");
  }

  if (!formData.companyName?.trim()) {
    throw new Error("Nome da empresa é obrigatório");
  }

  if (!formData.firstPaymentDate) {
    throw new Error("Data do primeiro pagamento é obrigatória");
  }

  if (formData.status === "inactive" && !formData.lastPaymentDate) {
    throw new Error("Data do último pagamento é obrigatória para clientes inativos");
  }

  const clientData = {
    company_name: formData.companyName.trim(),
    contract_value: contractValue,
    first_payment_date: formData.firstPaymentDate,
    payment_type: formData.paymentType,
    status: formData.status,
    acquisition_channel: formData.acquisitionChannel === "outro" 
      ? formData.customAcquisitionChannel?.trim() 
      : formData.acquisitionChannel,
    company_birthday: formData.companyBirthday || null,
    contact_name: formData.contactName?.trim() || "",
    contact_phone: formData.contactPhone?.trim() || "",
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
    const sessionCheck = await verifySession();
    if (!sessionCheck.success) {
      throw new Error(sessionCheck.error);
    }

    let response;
    
    if (clientId) {
      response = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select();
    } else {
      response = await supabase
        .from('clients')
        .insert([clientData])
        .select();
    }

    const { data, error } = response;
    console.log("Resposta do Supabase:", { data, error });
    console.log("Tempo de resposta:", `${performance.now() - startTime}ms`);

    if (error) {
      console.error("Erro ao salvar cliente:", error);
      let errorMessage = "Erro ao salvar cliente";
      
      if (error.code === '23505') {
        errorMessage = "Já existe um cliente com este nome";
      } else if (error.code === '23514') {
        errorMessage = "Dados inválidos. Verifique os valores informados";
      }
      
      throw new Error(errorMessage);
    }

    if (!data || data.length === 0) {
      throw new Error("Nenhum dado retornado após salvar");
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Erro na operação:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao salvar cliente" 
    };
  }
};
