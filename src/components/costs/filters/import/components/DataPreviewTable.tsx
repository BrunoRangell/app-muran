import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Calendar, FileText, DollarSign } from "lucide-react";
import { UniversalMapping, FilePreview, OFXPreview } from "../types/mapping";

interface DataPreviewTableProps {
  mapping: UniversalMapping;
  preview: FilePreview | OFXPreview;
  className?: string;
}

export function DataPreviewTable({
  mapping,
  preview,
  className = "",
}: DataPreviewTableProps) {
  const isCSV = 'headers' in preview;
  
  if (!isCSV) {
    // Preview para OFX
    const ofxPreview = preview as OFXPreview;
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Preview dos Dados OFX</CardTitle>
          <CardDescription>
            Visualize como os dados serão interpretados com o mapeamento atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Data</span>
                </div>
                <Badge variant="outline" className="w-full justify-start">
                  {ofxPreview.sampleTransaction[mapping.dateField] || 'N/A'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Descrição</span>
                </div>
                <Badge variant="outline" className="w-full justify-start">
                  {getDescriptionValue(ofxPreview.sampleTransaction, mapping) || 'N/A'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Valor</span>
                </div>
                <Badge variant="outline" className="w-full justify-start">
                  {ofxPreview.sampleTransaction[mapping.amountField] || 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total de transações: {ofxPreview.totalTransactions}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview para CSV
  const csvPreview = preview as FilePreview;
  const startRow = mapping.skipFirstRow ? 1 : 0;
  const previewRows = csvPreview.rows.slice(startRow, startRow + 5);

  const getColumnIndex = (field: string) => {
    return csvPreview.headers.findIndex(h => h === field);
  };

  const dateColumnIndex = getColumnIndex(mapping.dateField);
  const descriptionColumnIndex = getColumnIndex(mapping.descriptionField as string);
  const amountColumnIndex = getColumnIndex(mapping.amountField);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Preview dos Dados CSV</CardTitle>
        <CardDescription>
          Visualize como os dados serão interpretados com o mapeamento atual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {csvPreview.headers.map((header, index) => (
                  <TableHead key={index} className="min-w-32">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {header || `Coluna ${index + 1}`}
                      </div>
                      {dateColumnIndex === index && (
                        <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                          <Calendar className="h-3 w-3 mr-1" />
                          Data
                        </Badge>
                      )}
                      {descriptionColumnIndex === index && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                          <FileText className="h-3 w-3 mr-1" />
                          Descrição
                        </Badge>
                      )}
                      {amountColumnIndex === index && (
                        <Badge variant="default" className="text-xs bg-orange-100 text-orange-700">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Valor
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-16">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => {
                const isValid = validateRow(row, dateColumnIndex, descriptionColumnIndex, amountColumnIndex);
                return (
                  <TableRow key={rowIndex} className={isValid ? '' : 'bg-destructive/5'}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="max-w-32 truncate text-sm">
                        {cell}
                      </TableCell>
                    ))}
                    <TableCell>
                      {isValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Total de linhas: {csvPreview.totalRows} | 
          Mostrando primeiras 5 linhas {mapping.skipFirstRow ? '(excluindo cabeçalho)' : ''}
        </div>
      </CardContent>
    </Card>
  );
}

function getDescriptionValue(transaction: Record<string, string>, mapping: UniversalMapping): string {
  if (Array.isArray(mapping.descriptionField)) {
    return mapping.descriptionField
      .map(field => transaction[field])
      .filter(Boolean)
      .join(' - ');
  }
  return transaction[mapping.descriptionField as string] || '';
}

function validateRow(row: string[], dateIndex: number, descIndex: number, amountIndex: number): boolean {
  if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) return false;
  
  const dateValue = row[dateIndex]?.trim();
  const descValue = row[descIndex]?.trim();
  const amountValue = row[amountIndex]?.trim();
  
  return !!(dateValue && descValue && amountValue);
}