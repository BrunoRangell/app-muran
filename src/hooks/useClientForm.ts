
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
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const sessionResult = await verifySession();
      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }

      const clientData = await prepareClientData(data);
      const result = await saveClient(clientData, initialData?.id);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: initialData 
            ? "Cliente atualizado com sucesso!" 
            : "Cliente cadastrado com sucesso!",
        });

        if (!initialData) {
          form.reset();
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("=== ERRO GERAL NA SUBMISSÃO ===", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
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

  return {
    form,
    isLoading,
    showLastPaymentDate,
    handleSubmit,
    handleDelete,
  };
};
