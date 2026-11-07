import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { FinanceSheetSync } from "@/components/financial-sync/FinanceSheetSync";

interface CostsPageHeaderProps {
  onNewCostClick: () => void;
}

export function CostsPageHeader({ onNewCostClick }: CostsPageHeaderProps) {
  return (
    <>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-muran-complementary">
          Registro de Custos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Custos da Muran, atualizados a partir da planilha Financeiro Muran
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        
      </div>
    </div>
    <div className="mt-4">
      <FinanceSheetSync />
    </div>
    </>
  );
}