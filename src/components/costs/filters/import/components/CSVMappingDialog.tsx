import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { detectCSVMapping, validateCSVMapping } from "../utils/csvUtils";

interface CSVMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  previewData: string[][];
  onConfirm: (mapping: CSVMapping) => void;
}

export interface CSVMapping {
  dateColumn: number;
  descriptionColumn: number;
  amountColumn: number;
  skipFirstRow: boolean;
  separator: string;
}

export function CSVMappingDialog({
  open,
  onOpenChange,
  columns,
  previewData,
  onConfirm,
}: CSVMappingDialogProps) {
  const [mapping, setMapping] = useState<CSVMapping>({
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    skipFirstRow: true,
    separator: ",",
  });

  // Auto-detectar mapeamento quando colunas mudam
  useEffect(() => {
    if (columns.length > 0) {
      const autoMapping = detectCSVMapping(columns);
      setMapping(prev => ({
        ...prev,
        ...autoMapping,
      }));
    }
  }, [columns]);

  const handleConfirm = () => {
    if (!validateCSVMapping(mapping)) {
      return; // Não permitir confirmar se mapeamento inválido
    }
    onConfirm(mapping);
    onOpenChange(false);
  };

  const isValidMapping = validateCSVMapping(mapping);

  const updateMapping = (field: keyof CSVMapping, value: any) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Mapeamento CSV</DialogTitle>
          <DialogDescription>
            Configure como os dados do CSV devem ser interpretados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mapeamento de Colunas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Coluna da Data</Label>
              <Select
                value={mapping.dateColumn.toString()}
                onValueChange={(value) => updateMapping('dateColumn', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index + 1} - {col || `Coluna ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coluna da Descrição</Label>
              <Select
                value={mapping.descriptionColumn.toString()}
                onValueChange={(value) => updateMapping('descriptionColumn', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index + 1} - {col || `Coluna ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coluna do Valor</Label>
              <Select
                value={mapping.amountColumn.toString()}
                onValueChange={(value) => updateMapping('amountColumn', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index + 1} - {col || `Coluna ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opções */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipFirstRow"
              checked={mapping.skipFirstRow}
              onCheckedChange={(checked) => updateMapping('skipFirstRow', checked)}
            />
            <Label htmlFor="skipFirstRow">
              Pular primeira linha (cabeçalho)
            </Label>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview dos Dados</Label>
            <div className="border rounded-lg max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col, index) => (
                      <TableHead key={index} className="min-w-32">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {col || `Coluna ${index + 1}`}
                          </div>
                          {mapping.dateColumn === index && (
                            <div className="text-xs text-blue-600">Data</div>
                          )}
                          {mapping.descriptionColumn === index && (
                            <div className="text-xs text-green-600">Descrição</div>
                          )}
                          {mapping.amountColumn === index && (
                            <div className="text-xs text-orange-600">Valor</div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="max-w-32 truncate">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!isValidMapping}
              className="bg-muran-primary hover:bg-muran-primary/90"
            >
              Importar CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}