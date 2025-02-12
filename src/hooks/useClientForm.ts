import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ClientFormData } from "@/types/client";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { clientFormSchema } from "@/validations/clientFormSchema";
import { verifySession, prepareClientData, saveClient } from "@/services/clientService";

interface UseClientFormProps {
  initialData?: {
    id: string;
    company_name: string;
    contract_value: number;
    first_payment_date: string;
    payment_type: "pre" | "post";
    status: "active" | "inactive";
    acquisition_channel: string;
    company_birthday: string;
    contact_name: string;
    contact_phone: string;
    last_payment_date?: string;
  } | null;
  onSuccess?: () => void;
}

export const useClientForm = ({ initialData, onSuccess }: UseClientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [showLastPaymentDate, setShowLastPaymentDate] = useState(
    initialData?.status === "inactive"
  );

  console.log("=== DADOS INICIAIS DO FORMULÁRIO ===", {
    initialData,
    timestamp: new Date().toISOString()
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: initialData?.company_name || "",
      contractValue: initialData?.contract_value || 0,
      firstPaymentDate: initialData?.first_payment_date || "",
      paymentType: initialData?.payment_type || "pre",
      status: initialData?.status || "active",
      acquisitionChannel: initialData?.acquisition_channel || "",
      customAcquisitionChannel: "",
      companyBirthday: initialData?.company_birthday || "",
      contactName: initialData?.contact_name || "",
      contactPhone: initialData?.contact_phone || "",
      lastPaymentDate: initialData?.last_payment_date || "",
    },
  });

  const handleSubmit = async (data: ClientFormData) => {
    console.log("=== INÍCIO DO PROCESSO DE SUBMISSÃO ===");
    console.log("Dados do formulário recebidos:", data);
    console.log("ID do cliente para atualização:", initialData?.id);
    
    if (isLoading) {
      console.log("Formulário já está em processo de submissão");
      return;
    }

    setIsLoading(true);
    console.log("Estado de loading atualizado para true");
    
    try {
      console.log("Iniciando verificação de sessão...");
      const sessionResult = await verifySession();
      console.log("Resultado da verificação de sessão:", sessionResult);
      
      if (!sessionResult.success) {
        console.error("Falha na verificação da sessão:", sessionResult.error);
        throw new Error(sessionResult.error);
      }

      console.log("Preparando dados do cliente...");
      const clientData = await prepareClientData(data);
      console.log("Dados do cliente preparados:", clientData);

      console.log("Salvando cliente...");
      console.log("Modo:", initialData?.id ? "UPDATE" : "CREATE");
      const result = await saveClient(clientData, initialData?.id);
      console.log("Resultado da operação:", result);

      if (result.success) {
        console.log("Operação realizada com sucesso");
        toast({
          title: "Sucesso!",
          description: initialData 
            ? "Cliente atualizado com sucesso!" 
            : "Cliente cadastrado com sucesso!",
        });

        if (!initialData) {
          console.log("Resetando formulário após criação");
          form.reset();
        }

        if (onSuccess) {
          console.log("Executando callback de sucesso");
          onSuccess();
        }
      } else {
        console.error("Falha na operação:", result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("=== ERRO GERAL NA SUBMISSÃO ===");
      console.error("Detalhes do erro:", {
        error,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : null
      });
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
      console.log("=== FINALIZANDO PROCESSO DE SUBMISSÃO ===");
      console.log("Atualizando estado de loading para false");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || isLoading) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', initialData.id)
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "status") {
        setShowLastPaymentDate(value.status === "inactive");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    console.log("=== FORMULÁRIO MONTADO/ATUALIZADO ===", {
      isEditing: !!initialData,
      clientId: initialData?.id,
      timestamp: new Date().toISOString()
    });
  }, [initialData]);

  return {
    form,
    isLoading,
    showLastPaymentDate,
    handleSubmit,
    handleDelete,
  };
};
