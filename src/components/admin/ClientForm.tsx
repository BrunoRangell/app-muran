import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ClientFormData } from "@/types/client";
import { CompanySection } from "./client-form/CompanySection";
import { PaymentSection } from "./client-form/PaymentSection";
import { StatusSection } from "./client-form/StatusSection";
import { ContactSection } from "./client-form/ContactSection";
import { parseCurrencyToNumber } from "@/utils/formatters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const clientFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contractValue: z.any().refine(val => {
    try {
      const number = parseCurrencyToNumber(String(val));
      return !isNaN(number) && number > 0;
    } catch (error) {
      return false;
    }
  }, "Valor do contrato inválido. Use apenas números e vírgula para decimais."),
  firstPaymentDate: z.string().refine(val => {
    try {
      return Boolean(val && new Date(val).toString() !== 'Invalid Date');
    } catch (error) {
      return false;
    }
  }, "Data de início inválida"),
  status: z.enum(["active", "inactive"], {
    required_error: "Status é obrigatório",
  }),
  paymentType: z.enum(["pre", "post"]).optional(),
  acquisitionChannel: z.string().optional(),
  customAcquisitionChannel: z.string().optional(),
  companyBirthday: z.string().refine(val => {
    if (!val) return true; // Campo opcional
    try {
      return new Date(val).toString() !== 'Invalid Date';
    } catch (error) {
      return false;
    }
  }, "Data de aniversário inválida").optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().refine(val => {
    if (!val) return true; // Campo opcional
    return /^(\(\d{2}\)\s?\d{4,5}-\d{4})?$/.test(val);
  }, "Formato de telefone inválido. Use (99) 99999-9999").optional(),
  lastPaymentDate: z.string().refine(val => {
    if (!val) return true; // Campo opcional
    try {
      return new Date(val).toString() !== 'Invalid Date';
    } catch (error) {
      return false;
    }
  }, "Data do último pagamento inválida").optional()
}).refine((data) => {
  if (data.status === "inactive" && !data.lastPaymentDate) {
    return false;
  }
  return true;
}, {
  message: "Data do último pagamento é obrigatória quando o status é inativo",
  path: ["lastPaymentDate"]
});

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
    last_payment_date?: string;
  } | null;
  onSuccess?: () => void;
}

export const ClientForm = ({ initialData, onSuccess }: ClientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [showLastPaymentDate, setShowLastPaymentDate] = useState(initialData?.status === "inactive");

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
    }
  });

  const status = form.watch("status");
  
  useEffect(() => {
    setShowLastPaymentDate(status === "inactive");
  }, [status]);

  const onSubmit = async (data: ClientFormData) => {
    if (isLoading) {
      console.log("Formulário já está sendo enviado, ignorando novo envio");
      return;
    }

    console.log("Iniciando envio do formulário com dados:", data);
    setIsLoading(true);
    
    try {
      let contractValue: number;
      try {
        contractValue = parseCurrencyToNumber(String(data.contractValue));
        console.log("Valor do contrato convertido:", contractValue);
        if (isNaN(contractValue) || contractValue <= 0) {
          throw new Error("Valor do contrato inválido");
        }
      } catch (error) {
        console.error("Erro ao converter valor do contrato:", error);
        toast({
          title: "Erro no valor do contrato",
          description: "Por favor, insira um valor válido (exemplo: 1.000,00)",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const dates = {
        firstPaymentDate: new Date(data.firstPaymentDate),
        companyBirthday: data.companyBirthday ? new Date(data.companyBirthday) : null,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : null
      };

      console.log("Datas convertidas:", dates);

      if (dates.firstPaymentDate.toString() === 'Invalid Date') {
        console.error("Data de início inválida");
        toast({
          title: "Erro na data",
          description: "Data de início inválida",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (dates.companyBirthday && dates.companyBirthday.toString() === 'Invalid Date') {
        console.error("Data de aniversário inválida");
        toast({
          title: "Erro na data",
          description: "Data de aniversário da empresa inválida",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (dates.lastPaymentDate && dates.lastPaymentDate.toString() === 'Invalid Date') {
        console.error("Data do último pagamento inválida");
        toast({
          title: "Erro na data",
          description: "Data do último pagamento inválida",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const finalAcquisitionChannel = data.acquisitionChannel === "outro" 
        ? data.customAcquisitionChannel 
        : data.acquisitionChannel;

      const clientData = {
        company_name: data.companyName,
        contract_value: contractValue,
        first_payment_date: data.firstPaymentDate,
        payment_type: data.paymentType,
        status: data.status,
        acquisition_channel: finalAcquisitionChannel || "",
        company_birthday: data.companyBirthday || null,
        contact_name: data.contactName || "",
        contact_phone: data.contactPhone || "",
        last_payment_date: data.status === "inactive" ? (data.lastPaymentDate || null) : null,
      };

      console.log("Dados do cliente preparados para envio:", clientData);

      if (initialData?.id) {
        console.log("Atualizando cliente existente...");
        const { data: updateData, error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id)
          .single();

        if (updateError) {
          console.error("Erro ao atualizar cliente:", updateError);
          throw updateError;
        }

        console.log("Cliente atualizado com sucesso:", updateData);
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso!",
        });
      } else {
        console.log("Criando novo cliente...");
        const { data: insertData, error: insertError } = await supabase
          .from('clients')
          .insert([clientData])
          .single();

        if (insertError) {
          console.error("Erro ao inserir cliente:", insertError);
          throw insertError;
        }

        console.log("Cliente criado com sucesso:", insertData);
        toast({
          title: "Sucesso!",
          description: "Cliente cadastrado com sucesso!",
        });

        form.reset({
          companyName: "",
          contractValue: 0,
          firstPaymentDate: "",
          paymentType: "pre",
          status: "active",
          acquisitionChannel: "",
          customAcquisitionChannel: "",
          companyBirthday: "",
          contactName: "",
          contactPhone: "",
          lastPaymentDate: "",
        });
      }

      if (onSuccess) {
        console.log("Chamando callback de sucesso");
        onSuccess();
      }
    } catch (error) {
      console.error("Erro detalhado ao salvar cliente:", error);
      
      let errorMessage = "Não foi possível salvar o cliente. Por favor, tente novamente.";
      if (error instanceof Error) {
        console.error("Mensagem de erro:", error.message);
        if (error.message === "Tempo limite excedido") {
          errorMessage = "A operação demorou muito tempo. Por favor, tente novamente.";
        } else {
          // Adiciona detalhes do erro à mensagem
          errorMessage = `Erro ao salvar: ${error.message}`;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Finalizando processo de salvamento");
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
        description: "Não foi possível excluir o cliente. Por favor, tente novamente.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CompanySection form={form} />
          <PaymentSection form={form} />
          <StatusSection form={form} showLastPaymentDate={showLastPaymentDate} />
          <ContactSection form={form} />
        </div>

        <div className="flex justify-between mt-4">
          {initialData && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Cliente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente {initialData.company_name}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" disabled={isLoading} className="bg-muran-primary hover:bg-muran-primary/90 ml-auto">
            {isLoading ? "Salvando..." : initialData ? "Atualizar cliente" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
