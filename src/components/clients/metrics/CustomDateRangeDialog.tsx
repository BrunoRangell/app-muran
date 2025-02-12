
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isValid } from "date-fns";
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
      return '';
    }
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Erro ao formatar data:', error, date);
      return '';
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
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (isValid(newDate)) {
                  onDateRangeChange({
                    ...dateRange,
                    start: newDate
                  });
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={formatDateForInput(dateRange.end)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (isValid(newDate)) {
                  onDateRangeChange({
                    ...dateRange,
                    end: newDate
                  });
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
