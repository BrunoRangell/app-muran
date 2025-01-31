import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ClientFormData {
  companyName: string;
  contractValue: number;
  firstPaymentDate: string;
  paymentType: "pre" | "post";
  status: "active" | "inactive";
  acquisitionChannel: string;
  companyBirthday: string;
  contactName: string;
  contactPhone: string;
  customAcquisitionChannel?: string;
}

const ACQUISITION_CHANNELS = [
  "Tráfego pago",
  "Indicação",
  "Prospecção fria",
  "outro"
] as const;

export const ClientForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomChannel, setShowCustomChannel] = useState(false);
  const { toast } = useToast();
  const form = useForm<ClientFormData>();

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const floatValue = parseFloat(numericValue) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(floatValue);
  };

  const parseCurrencyToNumber = (value: string) => {
    // Remove currency symbol, dots and replace comma with dot
    const cleanValue = value
      .replace(/^R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    // Convert to number
    const numberValue = parseFloat(cleanValue);
    console.log('Parsing currency value:', { original: value, cleaned: cleanValue, final: numberValue });
    return numberValue;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

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
      setShowCustomChannel(false);
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
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Nome da empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contractValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Contrato</FormLabel>
              <FormControl>
                <Input 
                  placeholder="R$ 0,00"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    e.target.value = formatted;
                    field.onChange(formatted);
                  }}
                  className="font-mono text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firstPaymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Primeiro Pagamento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pre">Pré-pago</SelectItem>
                  <SelectItem value="post">Pós-pago</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acquisitionChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal de Aquisição</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setShowCustomChannel(value === "outro");
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o canal de aquisição" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACQUISITION_CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomChannel && (
          <FormField
            control={form.control}
            name="customAcquisitionChannel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especifique o Canal</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o canal de aquisição" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="companyBirthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aniversário da Empresa</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato do Responsável</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(00) 00000-0000"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                    field.onChange(formatted);
                  }}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar cliente"}
        </Button>
      </form>
    </Form>
  );
};