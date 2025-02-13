
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientDetailsTable } from "./ClientDetailsTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DetailsDialogProps {
  selectedPoint: {
    month: string;
    metric: string;
    value: number;
  } | null;
  onOpenChange: (open: boolean) => void;
  clients: any[];
}

export const DetailsDialog = ({ selectedPoint, onOpenChange, clients }: DetailsDialogProps) => {
  const formatMonthYear = (monthYear: string) => {
    try {
      const [month, year] = monthYear.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, "MMM'/'yy", { locale: ptBR }).toLowerCase();
    } catch (error) {
      console.error('Erro ao formatar mês:', error, monthYear);
      return monthYear;
    }
  };

  return (
    <Dialog open={!!selectedPoint} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPoint?.metric} - {selectedPoint?.month ? formatMonthYear(selectedPoint.month) : ''}
          </DialogTitle>
        </DialogHeader>
        
        <ClientDetailsTable 
          clients={clients}
          metric={selectedPoint?.metric || ''}
        />
      </DialogContent>
    </Dialog>
  );
};
