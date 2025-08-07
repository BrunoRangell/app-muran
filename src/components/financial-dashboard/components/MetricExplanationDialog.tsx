import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MetricExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    title: string;
    value: string;
    explanation: string;
    calculation: string;
    dataSource: string;
  } | null;
}

export const MetricExplanationDialog = ({
  isOpen,
  onClose,
  metric
}: MetricExplanationDialogProps) => {
  if (!metric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-muran-dark flex items-center gap-2">
            <span className="text-muran-primary">📊</span>
            {metric.title}
          </DialogTitle>
          <DialogDescription className="text-lg font-semibold text-muran-primary">
            Valor atual: {metric.value}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="font-semibold text-muran-dark mb-2">🔍 O que significa:</h4>
            <p className="text-gray-700 leading-relaxed">{metric.explanation}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-muran-dark mb-2">🧮 Como é calculado:</h4>
            <p className="text-gray-700 leading-relaxed">{metric.calculation}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-muran-dark mb-2">💾 Fonte dos dados:</h4>
            <p className="text-gray-700 leading-relaxed">{metric.dataSource}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};