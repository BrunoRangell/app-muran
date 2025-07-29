
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface RegistroPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: any;
  onSuccess: () => void;
}

export function RegistroPagamentoDialog({ 
  open, 
  onOpenChange, 
  cliente, 
  onSuccess 
}: RegistroPagamentoDialogProps) {
  const [valor, setValor] = useState("");
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM"));
  const [dataFimPagamento, setDataFimPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [multiploPeriodo, setMultiploPeriodo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Inicializa os valores quando o diálogo é aberto
  useEffect(() => {
    if (open && cliente) {
      // Formata o valor do contrato para exibição
      setValor(formatCurrency(cliente.contract_value || 0));
      setDataPagamento(format(new Date(), "yyyy-MM"));
      setDataFimPagamento("");
      setObservacoes("");
      setMultiploPeriodo(false);
    }
  }, [open, cliente]);

  // Formata o valor digitado como moeda
  const formatarValor = (valor: string) => {
    // Remove caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, "");
    
    if (apenasNumeros === "") {
      setValor("");
      return;
    }
    
    // Converte para número (centavos)
    const valorNumerico = parseInt(apenasNumeros, 10) / 100;
    setValor(formatCurrency(valorNumerico));
  };

  // Salva o pagamento no banco de dados
  const handleSubmit = async () => {
    if (!cliente || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Extrai o valor numérico (remove formatação de moeda)
      const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, "").replace(",", "."));
      
      if (isNaN(valorNumerico)) {
        toast({
          title: "Erro",
          description: "Por favor, insira um valor válido",
          variant: "destructive"
        });
        return;
      }
      
      if (multiploPeriodo && dataFimPagamento) {
        // Calcular meses entre as datas selecionadas
        const meses = gerarPeriodos(dataPagamento, dataFimPagamento);
        
        if (meses.length === 0) {
          toast({
            title: "Erro",
            description: "Período inválido. A data final deve ser posterior à data inicial.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Registrar pagamentos para cada mês
        const pagamentos = meses.map(mes => ({
          client_id: cliente.id,
          amount: valorNumerico,
          reference_month: `${mes}-01`,
          notes: observacoes || null
        }));
        
        const { error } = await supabase.from("payments").insert(pagamentos);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: `${pagamentos.length} pagamentos registrados com sucesso`
        });
        
        onSuccess();
      } else {
        // Registrar pagamento único
        const { error } = await supabase.from("payments").insert({
          client_id: cliente.id,
          amount: valorNumerico,
          reference_month: `${dataPagamento}-01`, // Primeiro dia do mês
          notes: observacoes || null
        });
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Pagamento registrado com sucesso"
        });
        
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gera um array com os períodos entre duas datas
  const gerarPeriodos = (inicio: string, fim: string) => {
    const result: string[] = [];
    const [anoInicio, mesInicio] = inicio.split('-').map(Number);
    const [anoFim, mesFim] = fim.split('-').map(Number);
    
    // Verificar se as datas são válidas
    if (
      isNaN(anoInicio) || isNaN(mesInicio) || isNaN(anoFim) || isNaN(mesFim) ||
      anoFim < anoInicio || (anoFim === anoInicio && mesFim < mesInicio)
    ) {
      return [];
    }
    
    let anoAtual = anoInicio;
    let mesAtual = mesInicio;
    
    while (anoAtual < anoFim || (anoAtual === anoFim && mesAtual <= mesFim)) {
      result.push(`${anoAtual}-${String(mesAtual).padStart(2, '0')}`);
      
      mesAtual++;
      if (mesAtual > 12) {
        mesAtual = 1;
        anoAtual++;
      }
    }
    
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isLoading && onOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {cliente?.company_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input 
              id="valor"
              value={valor}
              onChange={(e) => formatarValor(e.target.value)}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="periodo-multiplo"
              checked={multiploPeriodo}
              onCheckedChange={setMultiploPeriodo}
              disabled={isLoading}
            />
            <Label htmlFor="periodo-multiplo">Registrar para múltiplos meses</Label>
          </div>
          
          {multiploPeriodo ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicial">Mês inicial</Label>
                <Input
                  id="data-inicial"
                  type="month"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-final">Mês final</Label>
                <Input
                  id="data-final"
                  type="month"
                  value={dataFimPagamento}
                  onChange={(e) => setDataFimPagamento(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="data-pagamento">Mês de referência</Label>
              <Input
                id="data-pagamento"
                type="month"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o pagamento..."
              disabled={isLoading}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
