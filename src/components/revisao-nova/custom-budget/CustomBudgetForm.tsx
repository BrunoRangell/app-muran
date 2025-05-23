
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface CustomBudgetFormData {
  clientId: string;
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
  platform?: string;
}

interface CustomBudgetFormProps {
  selectedBudget: CustomBudgetFormData | null;
  isSubmitting: boolean;
  onSubmit: (data: CustomBudgetFormData) => void;
  onCancel: () => void;
}

export function CustomBudgetForm({ 
  selectedBudget,
  isSubmitting,
  onSubmit,
  onCancel
}: CustomBudgetFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string>(selectedBudget?.clientId || "");
  const [budgetAmount, setBudgetAmount] = useState<string>(selectedBudget?.budgetAmount ? String(selectedBudget.budgetAmount) : "");
  const [startDate, setStartDate] = useState<Date | undefined>(selectedBudget?.startDate ? new Date(selectedBudget.startDate) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(selectedBudget?.endDate ? new Date(selectedBudget.endDate) : undefined);
  const [description, setDescription] = useState<string>(selectedBudget?.description || "");
  const [platform, setPlatform] = useState<string>(selectedBudget?.platform || "meta");

  // Buscar clientes para o dropdown
  const { data: clients } = useQuery({
    queryKey: ["clients-for-custom-budget"],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("status", "active")
        .order("company_name");

      if (error) {
        toast({
          title: "Erro ao buscar clientes",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return clients || [];
    },
  });

  // Formatar valor do orçamento para exibição
  const formatCurrencyInput = (value: string) => {
    // Remover caracteres não numéricos
    const numericValue = value.replace(/[^\d]/g, "");
    
    // Converter para centavos e depois para reais com vírgula
    const floatValue = parseInt(numericValue) / 100;
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(floatValue);
  };

  // Converter o valor formatado em número
  const parseCurrencyValue = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/[^\d]/g, "");
    return parseInt(numericValue) / 100;
  };

  // Lidar com mudança no valor do orçamento
  const handleBudgetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    
    if (rawValue === "") {
      setBudgetAmount("");
      return;
    }
    
    const numericValue = parseInt(rawValue);
    
    if (isNaN(numericValue)) {
      setBudgetAmount("");
      return;
    }
    
    setBudgetAmount(String(numericValue));
  };

  // Formatar o valor do orçamento quando o campo perde o foco
  const handleBudgetValueBlur = () => {
    if (budgetAmount === "") {
      return;
    }
    
    // Garantir que o valor tenha pelo menos 2 casas decimais (centavos)
    const paddedValue = budgetAmount.padStart(3, "0");
    
    // Converter para centavos e depois para reais
    const floatValue = parseInt(paddedValue) / 100;
    
    // Atualizar o estado com o valor formatado
    setBudgetAmount(String(floatValue * 100));
  };

  // Validar o formulário antes de enviar
  const validateForm = (): boolean => {
    if (!clientId) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente para criar o orçamento personalizado.",
        variant: "destructive",
      });
      return false;
    }

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast({
        title: "Valor do orçamento inválido",
        description: "Informe um valor válido para o orçamento.",
        variant: "destructive",
      });
      return false;
    }

    if (!startDate) {
      toast({
        title: "Data de início obrigatória",
        description: "Selecione uma data de início para o orçamento personalizado.",
        variant: "destructive",
      });
      return false;
    }

    if (!endDate) {
      toast({
        title: "Data de término obrigatória",
        description: "Selecione uma data de término para o orçamento personalizado.",
        variant: "destructive",
      });
      return false;
    }

    if (startDate > endDate) {
      toast({
        title: "Datas inválidas",
        description: "A data de início não pode ser posterior à data de término.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Enviar o formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Converter datas para formato ISO
    const formattedStartDate = startDate!.toISOString().split("T")[0];
    const formattedEndDate = endDate!.toISOString().split("T")[0];

    // Preparar dados para envio
    const formData: CustomBudgetFormData = {
      clientId,
      budgetAmount: parseFloat(budgetAmount) / 100,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      description,
      platform
    };

    // Chamar função de envio
    onSubmit(formData);
  };

  // Efeitos para atualizar o formulário quando o orçamento selecionado muda
  useEffect(() => {
    if (selectedBudget) {
      setClientId(selectedBudget.clientId || "");
      setBudgetAmount(selectedBudget.budgetAmount ? String(selectedBudget.budgetAmount * 100) : "");
      setStartDate(selectedBudget.startDate ? new Date(selectedBudget.startDate) : undefined);
      setEndDate(selectedBudget.endDate ? new Date(selectedBudget.endDate) : undefined);
      setDescription(selectedBudget.description || "");
      setPlatform(selectedBudget.platform || "meta");
    }
  }, [selectedBudget]);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form className="space-y-4">
          {/* Plataforma */}
          <div className="space-y-1">
            <Label htmlFor="platform">Plataforma</Label>
            <RadioGroup
              value={platform}
              onValueChange={setPlatform}
              className="flex flex-row space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="meta" id="platform-meta" />
                <Label htmlFor="platform-meta">Meta Ads</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="platform-google" />
                <Label htmlFor="platform-google">Google Ads</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Cliente */}
          <div className="space-y-1">
            <Label htmlFor="client">Cliente</Label>
            <select
              id="client"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isSubmitting || selectedBudget !== null}
            >
              <option value="">Selecione um cliente</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Valor do Orçamento */}
          <div className="space-y-1">
            <Label htmlFor="budgetAmount">Valor do Orçamento</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">R$</span>
              <Input
                id="budgetAmount"
                value={
                  budgetAmount
                    ? new Intl.NumberFormat("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(parseFloat(budgetAmount) / 100)
                    : ""
                }
                onChange={handleBudgetValueChange}
                onBlur={handleBudgetValueBlur}
                className="pl-8"
                placeholder="0,00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Data de Início */}
          <div className="space-y-1">
            <Label htmlFor="startDate">Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !startDate ? "text-gray-400" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Término */}
          <div className="space-y-1">
            <Label htmlFor="endDate">Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !endDate ? "text-gray-400" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                  disabled={(date) =>
                    startDate ? date < startDate : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre o orçamento personalizado"
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-muran-primary hover:bg-muran-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : selectedBudget ? (
                "Atualizar Orçamento"
              ) : (
                "Criar Orçamento"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
