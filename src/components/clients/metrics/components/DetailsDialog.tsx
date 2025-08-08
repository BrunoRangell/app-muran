
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientDetailsTable } from "./ClientDetailsTable";
import { RevenueDetailsTable } from "./RevenueDetailsTable";

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

  return (
    <Dialog open={!!selectedPoint} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPoint?.metric} - {selectedPoint?.month || ''}
          </DialogTitle>
        </DialogHeader>
        
        {selectedPoint?.metric === 'Receita Mensal' ? (
          <RevenueDetailsTable monthStr={selectedPoint.month} />
        ) : (
          <ClientDetailsTable 
            clients={clients}
            metric={selectedPoint?.metric || ''}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
