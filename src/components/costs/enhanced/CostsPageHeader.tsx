import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { ImportCostsDialog } from "@/components/costs/filters/import/ImportCostsDialog";

interface CostsPageHeaderProps {
  onNewCostClick: () => void;
}

export function CostsPageHeader({ onNewCostClick }: CostsPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Registro de Custos
        </h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe todos os custos do seu negócio com análises detalhadas
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="default"
          className="gap-2 hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        
        <ImportCostsDialog />
        
        <Button 
          onClick={onNewCostClick}
          className="gap-2 shadow-sm hover:shadow-md transition-shadow"
          size="default"
        >
          <Plus className="h-4 w-4" />
          Novo Custo
        </Button>
      </div>
    </div>
  );
}