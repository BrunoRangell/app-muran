import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ClientFormData } from "@/types/client";
import { CompanySection } from "./client-form/CompanySection";
import { PaymentSection } from "./client-form/PaymentSection";
import { StatusSection } from "./client-form/StatusSection";
import { ContactSection } from "./client-form/ContactSection";
import { parseCurrencyToNumber } from "@/utils/formatters";

interface ClientFormProps {
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
  } | null;
  onSuccess?: () => void;
}

export const ClientForm = ({ initialData, onSuccess }: ClientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<ClientFormData>();

  useEffect(() => {
    if (initialData) {
      console.log("Setting form values with initial data:", initialData);
      form.reset({
        companyName: initialData.company_name,
        contractValue: initialData.contract_value,
        firstPaymentDate: initialData.first_payment_date,
        paymentType: initialData.payment_type,
        status: initialData.status,
        acquisitionChannel: initialData.acquisition_channel,
        companyBirthday: initialData.company_birthday,
        contactName: initialData.contact_name,
        contactPhone: initialData.contact_phone,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      console.log("Salvando cliente:", data);
      
      const finalAcquisitionChannel = data.acquisitionChannel === "outro" 
        ? data.customAcquisitionChannel 
        : data.acquisitionChannel;

      const contractValue = parseCurrencyToNumber(data.contractValue.toString());
      console.log('Contract value being saved:', contractValue);

      const clientData = {
        company_name: data.companyName,
        contract_value: contractValue,
        first_payment_date: data.firstPaymentDate,
        payment_type: data.paymentType,
        status: data.status,
        acquisition_channel: finalAcquisitionChannel,
        company_birthday: data.companyBirthday,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
      };

      if (initialData) {
        const { error: dbError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id);

        if (dbError) throw dbError;
        console.log("Cliente atualizado com sucesso!");
      } else {
        const { error: dbError } = await supabase
          .from('clients')
          .insert([clientData]);

        if (dbError) throw dbError;
        console.log("Cliente cadastrado com sucesso!");
      }

      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CompanySection form={form} />
        <PaymentSection form={form} />
        <StatusSection form={form} />
        <ContactSection form={form} />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : initialData ? "Atualizar cliente" : "Cadastrar cliente"}
        </Button>
      </form>
    </Form>
  );
};