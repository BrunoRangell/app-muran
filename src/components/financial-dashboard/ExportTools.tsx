
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, Table, Share2 } from "lucide-react";
import { CostFilters } from "@/types/cost";

interface ExportToolsProps {
  filters: CostFilters;
}

export const ExportTools = ({ filters }: ExportToolsProps) => {
  const handleExport = (format: string) => {
    // Implementar lógica de exportação
    console.log(`Exportando em formato: ${format}`);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <Download className="h-4 w-4 text-muran-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-muran-dark">Exportar Relatório</h3>
            <p className="text-sm text-gray-600">Salve os dados em diferentes formatos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            <Table className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('share')}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
    </Card>
  );
};
