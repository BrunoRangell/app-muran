import { useState } from "react";
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

export const ClientForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<ClientFormData>();

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      console.log("Criando novo cliente:", data);
      
      const finalAcquisitionChannel = data.acquisitionChannel === "outro" 
        ? data.customAcquisitionChannel 
        : data.acquisitionChannel;

      const contractValue = parseCurrencyToNumber(data.contractValue.toString());
      console.log('Contract value being saved:', contractValue);

      const { error: dbError } = await supabase
        .from('clients')
        .insert([
          {
            company_name: data.companyName,
            contract_value: contractValue,
            first_payment_date: data.firstPaymentDate,
            payment_type: data.paymentType,
            status: data.status,
            acquisition_channel: finalAcquisitionChannel,
            company_birthday: data.companyBirthday,
            contact_name: data.contactName,
            contact_phone: data.contactPhone,
          }
        ]);

      if (dbError) throw dbError;

      console.log("Cliente cadastrado com sucesso!");

      toast({
        title: "Sucesso!",
        description: "Cliente cadastrado com sucesso!",
      });
      
      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente. Por favor, tente novamente.",
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
          {isLoading ? "Cadastrando..." : "Cadastrar cliente"}
        </Button>
      </form>
    </Form>
  );
};