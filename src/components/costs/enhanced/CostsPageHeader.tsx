import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { ImportCostsDialog } from "@/components/costs/filters/import/ImportCostsDialog";

interface CostsPageHeaderProps {
  onNewCostClick: () => void;
}

export function CostsPageHeader({ onNewCostClick }: CostsPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-muran-complementary">
          Registro de Custos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie e acompanhe todos os custos do seu negócio
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
        
        <ImportCostsDialog />
        
        <Button 
          onClick={onNewCostClick}
          className="bg-muran-primary hover:bg-muran-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Custo
        </Button>
      </div>
    </div>
  );
}