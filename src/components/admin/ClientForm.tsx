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

  // Log inicial do componente
  useEffect(() => {
    console.log("ClientForm montado", {
      initialData,
      isEditing: !!initialData,
      currentTimestamp: new Date().toISOString()
    });
  }, [initialData]);

  // Log detalhado da sessão no carregamento e a cada 30 segundos
  useEffect(() => {
    const checkSession = async () => {
      console.log("Iniciando verificação de sessão...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Estado detalhado da sessão:", {
          hasSession: !!session,
          user: session?.user,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          error: error?.message,
          timestamp: new Date().toISOString()
        });

        if (session?.user) {
          const { data: userRoles, error: rolesError } = await supabase
            .from('team_members')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          console.log("Permissões do usuário:", {
            roles: userRoles,
            error: rolesError?.message
          });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Log mudanças nos valores do formulário
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("Mudança no formulário:", {
        field: name,
        type,
        newValue: value,
        timestamp: new Date().toISOString()
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const status = form.watch("status");
  
  useEffect(() => {
    console.log("Status alterado:", {
      newStatus: status,
      showLastPaymentDate: status === "inactive",
      timestamp: new Date().toISOString()
    });
    setShowLastPaymentDate(status === "inactive");
  }, [status]);

  const onSubmit = async (data: ClientFormData) => {
    console.log("=== INÍCIO DO PROCESSO DE SUBMISSÃO ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Dados recebidos:", data);

    if (isLoading) {
      console.log("Formulário já está sendo enviado, ignorando novo envio");
      return;
    }

    setIsLoading(true);
    console.log("Estado de loading atualizado:", true);
    
    try {
      console.log("Verificando sessão antes da inserção...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log("Detalhes da sessão:", {
        hasSession: !!session,
        sessionError,
        user: session?.user,
        accessToken: session?.access_token ? "Presente" : "Ausente",
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      });

      if (!session) {
        console.error("Sessão ausente!");
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      console.log("Iniciando conversão do valor do contrato...");
      let contractValue: number;
      try {
        contractValue = parseCurrencyToNumber(String(data.contractValue));
        console.log("Detalhes da conversão do valor:", {
          original: data.contractValue,
          converted: contractValue,
          type: typeof contractValue,
          isValid: !isNaN(contractValue) && contractValue > 0
        });

        if (isNaN(contractValue) || contractValue <= 0) {
          throw new Error("Valor do contrato inválido");
        }
      } catch (error) {
        console.error("Erro detalhado na conversão do valor:", {
          error,
          input: data.contractValue,
          timestamp: new Date().toISOString()
        });
        toast({
          title: "Erro no valor do contrato",
          description: "Por favor, insira um valor válido (exemplo: 1.000,00)",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("Processando datas...");
      const dates = {
        firstPaymentDate: new Date(data.firstPaymentDate),
        companyBirthday: data.companyBirthday ? new Date(data.companyBirthday) : null,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : null
      };

      console.log("Datas processadas:", {
        dates,
        isFirstPaymentValid: dates.firstPaymentDate.toString() !== 'Invalid Date',
        isBirthdayValid: !dates.companyBirthday || dates.companyBirthday.toString() !== 'Invalid Date',
        isLastPaymentValid: !dates.lastPaymentDate || dates.lastPaymentDate.toString() !== 'Invalid Date'
      });

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

      console.log("=== DADOS PREPARADOS PARA ENVIO ===");
      console.log("Dados do cliente:", clientData);
      console.log("Tipos dos dados:", {
        company_name: typeof clientData.company_name,
        contract_value: typeof clientData.contract_value,
        first_payment_date: typeof clientData.first_payment_date,
        payment_type: typeof clientData.payment_type,
        status: typeof clientData.status,
        acquisition_channel: typeof clientData.acquisition_channel,
        company_birthday: typeof clientData.company_birthday,
        contact_name: typeof clientData.contact_name,
        contact_phone: typeof clientData.contact_phone,
        last_payment_date: typeof clientData.last_payment_date
      });

      if (initialData?.id) {
        console.log("=== INICIANDO ATUALIZAÇÃO ===");
        console.log("ID do cliente:", initialData.id);
        
        const { data: updateData, error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id)
          .single();

        console.log("Resposta da atualização:", {
          success: !updateError,
          data: updateData,
          error: updateError ? {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint
          } : null
        });

        if (updateError) {
          console.error("Erro detalhado na atualização:", updateError);
          throw updateError;
        }

        console.log("Cliente atualizado com sucesso:", updateData);
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso!",
        });
      } else {
        console.log("=== INICIANDO INSERÇÃO ===");
        console.log("Timestamp início inserção:", new Date().toISOString());
        
        try {
          console.log("Chamando Supabase insert...");
          const startTime = performance.now();
          
          const { data: insertData, error: insertError } = await supabase
            .from('clients')
            .insert([clientData]);
              
          const endTime = performance.now();
          console.log("Tempo de resposta do Supabase:", `${endTime - startTime}ms`);
          
          console.log("Resposta completa do Supabase:", {
            data: insertData,
            error: insertError ? {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            } : null,
            timestamp: new Date().toISOString()
          });

          if (insertError) {
            console.error("=== ERRO NA INSERÇÃO ===");
            console.error("Erro detalhado do Supabase:", {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              timestamp: new Date().toISOString()
            });
            throw new Error(`Erro ao salvar cliente: ${insertError.message}`);
          }

          console.log("=== INSERÇÃO BEM-SUCEDIDA ===");
          console.log("Timestamp conclusão:", new Date().toISOString());
          
          toast({
            title: "Sucesso!",
            description: "Cliente cadastrado com sucesso!",
          });

          console.log("Resetando formulário...");
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
          console.log("Formulário resetado com sucesso");
          
        } catch (insertError) {
          console.error("Erro na operação de inserção:", {
            error: insertError,
            timestamp: new Date().toISOString(),
            stack: insertError instanceof Error ? insertError.stack : undefined
          });
          throw insertError;
        }
      }

      if (onSuccess) {
        console.log("Executando callback de sucesso");
        onSuccess();
      }

    } catch (error) {
      console.error("=== ERRO GERAL NA SUBMISSÃO ===");
      console.error("Erro detalhado:", {
        error,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = "Não foi possível salvar o cliente. Por favor, tente novamente.";
      if (error instanceof Error) {
        console.error("Mensagem de erro:", error.message);
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("=== FINALIZANDO PROCESSO DE SUBMISSÃO ===");
      console.log("Timestamp final:", new Date().toISOString());
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
