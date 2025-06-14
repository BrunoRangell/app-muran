
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/unifiedFormatters";

interface EditarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: any;
  nomeCliente: string;
  onSuccess: () => void;
}

export function EditarPagamentoDialog({
  open,
  onOpenChange,
  pagamento,
  nomeCliente,
  onSuccess
}: EditarPagamentoDialogProps) {
  const [valor, setValor] = useState("");
  const [dataReferencia, setDataReferencia] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Inicializa valores quando o diálogo é aberto
  useEffect(() => {
    if (pagamento && open) {
      setValor(formatCurrency(pagamento.amount || 0));
      
      try {
        if (pagamento.reference_month) {
          const data = parseISO(pagamento.reference_month);
          setDataReferencia(format(data, "yyyy-MM"));
        }
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        setDataReferencia("");
      }
      
      setObservacoes(pagamento.notes || "");
    }
  }, [pagamento, open]);

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

  // Salva as alterações no pagamento
  const handleSubmit = async () => {
    if (!pagamento?.id || isLoading) return;
    
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
      
      const { error } = await supabase
        .from("payments")
        .update({
          amount: valorNumerico,
          reference_month: `${dataReferencia}-01`, // Primeiro dia do mês
          notes: observacoes || null
        })
        .eq("id", pagamento.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso"
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isLoading && onOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Pagamento - {nomeCliente}</DialogTitle>
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
