
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientDetailsTable } from "./ClientDetailsTable";
import { RevenueDetailsTable } from "./RevenueDetailsTable";
import { ProfitDetailsTable } from "../../../financial-dashboard/components/ProfitDetailsTable";
import { CostsDetailsTable } from "../../../financial-dashboard/components/CostsDetailsTable";
import { CACDetailsTable } from "../../../financial-dashboard/components/CACDetailsTable";
import { LTVDetailsTable } from "../../../financial-dashboard/components/LTVDetailsTable";

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
        
        {(() => {
          switch (selectedPoint?.metric) {
            case 'Receita Mensal':
              return <RevenueDetailsTable monthStr={selectedPoint.month} />;
            case 'Lucro':
              return <ProfitDetailsTable monthStr={selectedPoint.month} />;
            case 'Custos Totais':
              return <CostsDetailsTable monthStr={selectedPoint.month} />;
            case 'CAC':
              return <CACDetailsTable monthStr={selectedPoint.month} />;
            case 'LTV (12 meses)':
              return <LTVDetailsTable monthStr={selectedPoint.month} />;
            default:
              return (
                <ClientDetailsTable 
                  clients={clients}
                  metric={selectedPoint?.metric || ''}
                />
              );
          }
        })()}
      </DialogContent>
    </Dialog>
  );
};
