
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isValid, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface CustomDateRangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export const CustomDateRangeDialog = ({
  isOpen,
  onOpenChange,
  dateRange,
  onDateRangeChange,
}: CustomDateRangeDialogProps) => {
  const { toast } = useToast();
  const [tempDateRange, setTempDateRange] = useState(dateRange);

  // Atualiza o tempDateRange quando dateRange muda (quando o diálogo é reaberto)
  useEffect(() => {
    if (isOpen) {
      setTempDateRange(dateRange);
    }
  }, [dateRange, isOpen]);

  const formatDateForInput = (date: Date) => {
    if (!isValid(date)) {
      console.error('Data inválida:', date);
      return format(new Date(), 'yyyy-MM-dd');
    }
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Erro ao formatar data:', error, date);
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    try {
      const newDate = parseISO(value);
      if (isValid(newDate)) {
        setTempDateRange(prev => ({
          ...prev,
          [type]: newDate
        }));
      }
    } catch (error) {
      console.error('Erro ao processar data:', error);
    }
  };

  const handleConfirm = () => {
    // Validar se as datas são válidas
    if (!isValid(tempDateRange.start) || !isValid(tempDateRange.end)) {
      toast({
        title: "Erro na seleção de datas",
        description: "Por favor, selecione datas válidas.",
        variant: "destructive",
      });
      return;
    }

    // Validar se a data inicial é anterior à data final
    if (isBefore(tempDateRange.end, tempDateRange.start)) {
      toast({
        title: "Erro na seleção de datas",
        description: "A data inicial deve ser anterior à data final.",
        variant: "destructive",
      });
      return;
    }

    // Se passou pelas validações, atualiza as datas
    onDateRangeChange(tempDateRange);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecione o período</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={formatDateForInput(tempDateRange.start)}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={formatDateForInput(tempDateRange.end)}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} className="bg-muran-primary hover:bg-muran-primary/90">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
