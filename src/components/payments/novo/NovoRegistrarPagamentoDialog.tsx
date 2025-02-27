
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
import { formatCurrency, parseCurrencyToNumber } from "@/utils/formatters";

interface NovoRegistrarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string | null;
  clienteNome?: string;
  valorContrato?: number;
  onSuccess: () => void;
}

export function NovoRegistrarPagamentoDialog({
  open,
  onOpenChange,
  clienteId,
  clienteNome = "",
  valorContrato = 0,
  onSuccess
}: NovoRegistrarPagamentoDialogProps) {
  const [valorPagamento, setValorPagamento] = useState("");
  const [dataReferencia, setDataReferencia] = useState(format(new Date(), "yyyy-MM"));
  const [dataFimReferencia, setDataFimReferencia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [multiplosMeses, setMultiplosMeses] = useState(false);
  const { toast } = useToast();

  // Quando o diálogo abre, inicializa os campos
  useEffect(() => {
    if (open && valorContrato) {
      setValorPagamento(formatCurrency(valorContrato));
      setDataReferencia(format(new Date(), "yyyy-MM"));
      setDataFimReferencia("");
      setObservacoes("");
      setMultiplosMeses(false);
    }
  }, [open, valorContrato]);

  const handleValorChange = (valor: string) => {
    // Remove caracteres não numéricos
    const numerico = valor.replace(/\D/g, "");
    if (numerico === "") {
      setValorPagamento("");
      return;
    }
    
    // Converte para número (dividindo por 100 para tratar os centavos)
    const valorNumerico = parseFloat(numerico) / 100;
    setValorPagamento(formatCurrency(valorNumerico));
  };

  const handleSubmit = async () => {
    if (!clienteId || isLoading) return;

    try {
      setIsLoading(true);

      // Se for registro para múltiplos meses
      if (multiplosMeses && dataFimReferencia) {
        const mesesParaRegistrar = gerarMeses(dataReferencia, dataFimReferencia);
        
        if (mesesParaRegistrar.length === 0) {
          toast({
            title: "Erro",
            description: "Período de referência inválido.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Cria pagamentos para cada mês
        const pagamentos = mesesParaRegistrar.map(mes => ({
          client_id: clienteId,
          amount: parseCurrencyToNumber(valorPagamento),
          reference_month: `${mes}-01`, // Primeiro dia do mês
          notes: observacoes || null
        }));

        const { error } = await supabase.from("payments").insert(pagamentos);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `${pagamentos.length} pagamentos registrados com sucesso.`
        });
      } else {
        // Registro para um único mês
        const { error } = await supabase.from("payments").insert({
          client_id: clienteId,
          amount: parseCurrencyToNumber(valorPagamento),
          reference_month: `${dataReferencia}-01`, // Primeiro dia do mês
          notes: observacoes || null
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pagamento registrado com sucesso."
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar array de meses entre duas datas
  const gerarMeses = (inicio: string, fim: string) => {
    const meses: string[] = [];
    const [anoInicio, mesInicio] = inicio.split("-").map(Number);
    const [anoFim, mesFim] = fim.split("-").map(Number);

    // Valida as datas
    if (anoFim < anoInicio || (anoFim === anoInicio && mesFim < mesInicio)) {
      return [];
    }

    let anoAtual = anoInicio;
    let mesAtual = mesInicio;

    while (anoAtual < anoFim || (anoAtual === anoFim && mesAtual <= mesFim)) {
      meses.push(`${anoAtual}-${mesAtual.toString().padStart(2, "0")}`);
      
      if (mesAtual === 12) {
        mesAtual = 1;
        anoAtual++;
      } else {
        mesAtual++;
      }
    }

    return meses;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isLoading) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {clienteNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              value={valorPagamento}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="multiplos-meses"
              checked={multiplosMeses}
              onCheckedChange={setMultiplosMeses}
              disabled={isLoading}
            />
            <Label htmlFor="multiplos-meses">Registrar em múltiplos meses</Label>
          </div>

          {multiplosMeses ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Mês inicial</Label>
                <Input
                  id="data-inicio"
                  type="month"
                  value={dataReferencia}
                  onChange={(e) => setDataReferencia(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Mês final</Label>
                <Input
                  id="data-fim"
                  type="month"
                  value={dataFimReferencia}
                  onChange={(e) => setDataFimReferencia(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="data-referencia">Mês de referência</Label>
              <Input
                id="data-referencia"
                type="month"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
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
