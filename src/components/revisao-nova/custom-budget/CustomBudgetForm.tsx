import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";
import { CustomBudgetFormData } from "../hooks/useCustomBudgets";

// Schema para validação do formulário
const customBudgetSchema = z.object({
  client_id: z.string({
    required_error: "Selecione um cliente",
  }),
  budget_amount: z.number({
    required_error: "Informe o valor do orçamento",
  }).positive("O valor deve ser maior que zero"),
  start_date: z.date({
    required_error: "Informe a data de início",
  }),
  end_date: z.date({
    required_error: "Informe a data de término",
  }).refine(
    (date) => date instanceof Date && !isNaN(date.getTime()),
    { message: "Data inválida" }
  ),
  description: z.string().nullable().optional(),
}).refine(
  (data) => data.end_date >= data.start_date,
  {
    message: "A data de término deve ser igual ou posterior à data de início",
    path: ["end_date"],
  }
);

interface CustomBudgetFormProps {
  selectedBudget: CustomBudgetFormData | null;
  isSubmitting: boolean;
  onSubmit: (data: CustomBudgetFormData) => void;
  onCancel: () => void;
}

type FormData = z.infer<typeof customBudgetSchema>;

export const CustomBudgetForm = ({
  selectedBudget,
  isSubmitting,
  onSubmit,
  onCancel,
}: CustomBudgetFormProps) => {
  const [formattedBudget, setFormattedBudget] = useState("");

  // Buscar clientes ativos
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["active-clients-for-budget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name");

      if (error) throw error;
      return data;
    },
  });

  // Configurar o formulário com react-hook-form e zod
  const form = useForm<FormData>({
    resolver: zodResolver(customBudgetSchema),
    defaultValues: {
      client_id: "",
      budget_amount: 0,
      start_date: new Date(),
      end_date: new Date(),
      description: "",
    },
  });

  // Preencher o formulário quando um orçamento for selecionado para edição
  useEffect(() => {
    if (selectedBudget) {
      // Corrigindo o problema da data: converter as strings para objetos Date
      // sem modificar o fuso horário (utilizando a data local)
      const correctedStartDate = new Date(selectedBudget.startDate + 'T00:00:00');
      const correctedEndDate = new Date(selectedBudget.endDate + 'T00:00:00');
      
      console.log('Datas originais:', selectedBudget.startDate, selectedBudget.endDate);
      console.log('Datas corrigidas:', correctedStartDate, correctedEndDate);
      
      form.reset({
        client_id: selectedBudget.clientId,
        budget_amount: selectedBudget.budgetAmount,
        start_date: correctedStartDate,
        end_date: correctedEndDate,
        description: selectedBudget.description,
      });
      setFormattedBudget(formatCurrency(selectedBudget.budgetAmount));
    } else {
      form.reset({
        client_id: "",
        budget_amount: 0,
        start_date: new Date(),
        end_date: new Date(),
        description: "",
      });
      setFormattedBudget("");
    }
  }, [selectedBudget, form]);

  // Manipulador para o campo de orçamento formatado como moeda
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormattedBudget(value);
    
    // Atualizar o valor no formulário apenas se for um número válido
    const numericValue = parseCurrencyToNumber(value);
    if (!isNaN(numericValue)) {
      form.setValue("budget_amount", numericValue);
    }
  };

  const handleBudgetBlur = () => {
    const numericValue = parseCurrencyToNumber(formattedBudget);
    if (!isNaN(numericValue)) {
      setFormattedBudget(formatCurrency(numericValue));
    }
  };

  // Calcular o número de dias no período e o valor diário
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");
  const budgetAmount = form.watch("budget_amount");

  const getDaysInPeriod = () => {
    if (startDate && endDate) {
      // +1 para incluir o dia inicial e final na contagem
      return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const getDailyBudget = () => {
    const days = getDaysInPeriod();
    if (days > 0 && budgetAmount) {
      return budgetAmount / days;
    }
    return 0;
  };

  // Manipulador de submissão do formulário
  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      clientId: data.client_id,
      budgetAmount: data.budget_amount,
      startDate: data.start_date.toISOString().split("T")[0],
      endDate: data.end_date.toISOString().split("T")[0],
      description: data.description || "",
    });
  };

  // Exibir um indicador de carregamento enquanto os clientes estão sendo carregados
  if (isLoadingClients) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-6 w-6 mr-2 text-muran-primary" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget_amount"
            render={() => (
              <FormItem>
                <FormLabel>Valor do Orçamento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    value={formattedBudget}
                    onChange={handleBudgetChange}
                    onBlur={handleBudgetBlur}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={isSubmitting}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Término</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={isSubmitting}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <span className="text-sm text-gray-500">Duração do período:</span>
              <p className="font-medium">{getDaysInPeriod()} dias</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Orçamento diário estimado:</span>
              <p className="font-medium">{formatCurrency(getDailyBudget())}</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione informações ou observações sobre este orçamento"
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-muran-primary hover:bg-muran-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                selectedBudget ? "Atualizar Orçamento" : "Adicionar Orçamento"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
