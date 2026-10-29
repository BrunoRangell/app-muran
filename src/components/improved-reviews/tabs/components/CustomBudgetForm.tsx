import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { customBudgetSchema, CustomBudgetFormData } from "../schemas/customBudgetSchema";

interface CustomBudgetFormProps {
  initialData?: Partial<CustomBudgetFormData & { id: string }>;
  onSubmit: (data: CustomBudgetFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CustomBudgetForm({ initialData, onSubmit, onCancel, isLoading }: CustomBudgetFormProps) {
  const [clientSearch, setClientSearch] = useState("");
  const { data: clients = [] } = useQuery({
    queryKey: ["custom-budget-form-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name")
        .range(0, 4999);
      if (error) throw error;
      return data ?? [];
    },
  });
  
  const form = useForm<CustomBudgetFormData>({
    resolver: zodResolver(customBudgetSchema),
    defaultValues: {
      platform: initialData?.platform || "meta",
      client_id: initialData?.client_id || "",
      budget_amount: initialData?.budget_amount || 0,
      start_date: initialData?.start_date || new Date(),
      end_date: initialData?.end_date || new Date(),
      description: initialData?.description || "",
      account_id: initialData?.account_id || "",
    },
  });

  const clientId = form.watch("client_id");
  const platform = form.watch("platform");
  const { data: accounts } = useClientAccounts(clientId, platform);

  const handleSubmit = async (data: CustomBudgetFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plataforma</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="meta" id="meta" />
                    <Label htmlFor="meta">Meta Ads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="google" id="google" />
                    <Label htmlFor="google">Google Ads</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <div className="rounded-md border">
                <Input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder={
                    clients.find((c) => c.id === field.value)?.company_name
                      ? `Selecionado: ${clients.find((c) => c.id === field.value)?.company_name} — pesquisar outro...`
                      : "Pesquisar cliente..."
                  }
                  className="border-0 border-b rounded-b-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div
                  className="max-h-48 overflow-y-auto p-1"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const q = normalize(clientSearch.trim());
                    const list = q ? clients.filter((c) => normalize(c.company_name).includes(q)) : clients;
                    if (list.length === 0) {
                      return <p className="py-4 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>;
                    }
                    return list.map((client) => (
                      <button
                        type="button"
                        key={client.id}
                        onClick={() => field.onChange(client.id)}
                        className={cn(
                          "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                          field.value === client.id && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <Check className={cn("mr-2 h-4 w-4 shrink-0", field.value === client.id ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{client.company_name}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {accounts && accounts.length > 1 && (
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta de Anúncio</FormLabel>
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name} ({acc.account_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="budget_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Orçamento</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="pl-10"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
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
                      initialFocus
                      className="pointer-events-auto"
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
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
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
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite uma descrição para este orçamento..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#ff6e00] hover:bg-[#e66300]"
          >
            {isLoading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Criar Orçamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
