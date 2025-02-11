
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema de validação
const clientFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contractValue: z.any().refine(val => {
    const number = parseCurrencyToNumber(String(val));
    return !isNaN(number) && number > 0;
  }, "Valor do contrato é obrigatório"),
  firstPaymentDate: z.string().min(1, "Data de início é obrigatória"),
  status: z.enum(["active", "inactive"], {
    required_error: "Status é obrigatório",
  }),
  paymentType: z.enum(["pre", "post"]).optional(),
  acquisitionChannel: z.string().optional(),
  customAcquisitionChannel: z.string().optional(),
  companyBirthday: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  lastPaymentDate: z.string().optional()
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
  const [showLastPaymentDate, setShowLastPaymentDate] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
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
    },
  });

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
        lastPaymentDate: initialData.last_payment_date,
      });
      setShowLastPaymentDate(initialData.status === "inactive");
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
        acquisition_channel: finalAcquisitionChannel || "",
        company_birthday: data.companyBirthday || null,
        contact_name: data.contactName || "",
        contact_phone: data.contactPhone || "",
        last_payment_date: data.status === "inactive" ? (data.lastPaymentDate || null) : null,
      };

      console.log("Dados formatados para salvar:", clientData);

      let error;
      if (initialData) {
        const { error: dbError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id);
        error = dbError;
      } else {
        const { error: dbError } = await supabase
          .from('clients')
          .insert([clientData]);
        error = dbError;
      }

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      console.log("Cliente salvo com sucesso!");
      toast({
        title: "Sucesso!",
        description: initialData 
          ? "Cliente atualizado com sucesso!" 
          : "Cliente cadastrado com sucesso!",
      });

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

  const handleDelete = async () => {
    if (!initialData?.id) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', initialData.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const status = form.watch("status");
  useEffect(() => {
    setShowLastPaymentDate(status === "inactive");
  }, [status]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompanySection form={form} />
          <PaymentSection form={form} />
          <StatusSection form={form} />
          <ContactSection form={form} />
          {showLastPaymentDate && (
            <div className="md:col-start-2">
              <FormField
                control={form.control}
                name="lastPaymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Último Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
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
