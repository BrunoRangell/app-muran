import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface CustomDateRangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export const CustomDateRangeDialog = ({
  isOpen,
  onOpenChange,
  dateRange = { start: new Date(), end: new Date() }, // Valor padrão adicionado
  onDateRangeChange,
}: CustomDateRangeDialogProps) => {
  console.log("CustomDateRangeDialog rendered with dateRange:", dateRange);

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
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onDateRangeChange({
                  ...dateRange,
                  start: newDate
                });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onDateRangeChange({
                  ...dateRange,
                  end: newDate
                });
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