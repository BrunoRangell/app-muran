
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        onDateRangeChange({
          ...dateRange,
          [type]: newDate
        });
      }
    } catch (error) {
      console.error('Erro ao processar data:', error);
    }
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
              value={formatDateForInput(dateRange.start)}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={formatDateForInput(dateRange.end)}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-muran-primary hover:bg-muran-primary/90">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
