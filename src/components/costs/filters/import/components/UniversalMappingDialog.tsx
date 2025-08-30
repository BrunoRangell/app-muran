import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Wand2, Settings, Eye, FileSpreadsheet, FileCode } from "lucide-react";
import { UniversalMapping, FilePreview, OFXPreview, MappingField, FieldOption } from "../types/mapping";
import { MappingFieldCard } from "./MappingFieldCard";
import { DataPreviewTable } from "./DataPreviewTable";

interface UniversalMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileType: 'csv' | 'ofx';
  preview: FilePreview | OFXPreview;
  onConfirm: (mapping: UniversalMapping) => void;
}

export function UniversalMappingDialog({
  open,
  onOpenChange,
  fileType,
  preview,
  onConfirm,
}: UniversalMappingDialogProps) {
  const [mapping, setMapping] = useState<UniversalMapping>({
    fileType,
    dateField: '',
    descriptionField: '',
    amountField: '',
    skipFirstRow: fileType === 'csv',
    separator: ',',
    descriptionStrategy: 'name',
    includeDebits: true,
    includeCredits: true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-detectar mapeamento inicial
  useEffect(() => {
    if (fileType === 'csv' && 'headers' in preview) {
      const csvPreview = preview as FilePreview;
      const autoMapping = detectCSVMapping(csvPreview.headers);
      setMapping(prev => ({ ...prev, ...autoMapping }));
    } else if (fileType === 'ofx' && 'availableFields' in preview) {
      const ofxPreview = preview as OFXPreview;
      const autoMapping = detectOFXMapping(ofxPreview.availableFields);
      setMapping(prev => ({ ...prev, ...autoMapping }));
    }
  }, [fileType, preview]);

  const mappingFields = getMappingFields(fileType, preview);
  const isValid = validateMapping(mapping, fileType);

  const handleFieldChange = (fieldKey: keyof UniversalMapping, value: string | string[]) => {
    setMapping(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(mapping);
    onOpenChange(false);
  };

  const autoDetect = () => {
    if (fileType === 'csv' && 'headers' in preview) {
      const csvPreview = preview as FilePreview;
      const autoMapping = detectCSVMapping(csvPreview.headers);
      setMapping(prev => ({ ...prev, ...autoMapping }));
    } else if (fileType === 'ofx' && 'availableFields' in preview) {
      const ofxPreview = preview as OFXPreview;
      const autoMapping = detectOFXMapping(ofxPreview.availableFields);
      setMapping(prev => ({ ...prev, ...autoMapping }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {fileType === 'csv' ? (
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            ) : (
              <FileCode className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <DialogTitle>
                Configurar Importação {fileType.toUpperCase()}
              </DialogTitle>
              <DialogDescription>
                Configure como os dados do arquivo devem ser interpretados para importação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Ações rápidas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={autoDetect}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Detectar Automaticamente
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showAdvanced"
                      checked={showAdvanced}
                      onCheckedChange={(checked) => setShowAdvanced(checked === true)}
                    />
                    <Label htmlFor="showAdvanced" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Opções avançadas
                    </Label>
                  </div>
                </div>
                
                <Badge variant={isValid ? "default" : "destructive"}>
                  {isValid ? "Configuração válida" : "Configuração incompleta"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Campos de mapeamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Mapeamento de Campos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mappingFields.map((field) => (
                <MappingFieldCard
                  key={field.key}
                  field={field}
                  value={mapping[field.key] as string | string[]}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  isValid={!field.required || !!mapping[field.key]}
                />
              ))}
            </div>
          </div>

          {/* Opções avançadas */}
          {showAdvanced && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">Opções Avançadas</h3>
              
              {fileType === 'csv' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipFirstRow"
                    checked={mapping.skipFirstRow}
                    onCheckedChange={(checked) => setMapping(prev => ({ ...prev, skipFirstRow: checked === true }))}
                  />
                  <Label htmlFor="skipFirstRow">
                    Pular primeira linha (cabeçalho)
                  </Label>
                </div>
              )}
              
              {fileType === 'ofx' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeDebits"
                        checked={mapping.includeDebits}
                        onCheckedChange={(checked) => setMapping(prev => ({ ...prev, includeDebits: checked === true }))}
                      />
                      <Label htmlFor="includeDebits">Incluir débitos</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeCredits"
                        checked={mapping.includeCredits}
                        onCheckedChange={(checked) => setMapping(prev => ({ ...prev, includeCredits: checked === true }))}
                      />
                      <Label htmlFor="includeCredits">Incluir créditos</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview dos dados */}
          <div className="space-y-4">
            <Separator />
            <DataPreviewTable
              mapping={mapping}
              preview={preview}
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isValid}
            className="bg-primary hover:bg-primary/90"
          >
            Importar Dados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Funções auxiliares
function detectCSVMapping(headers: string[]): Partial<UniversalMapping> {
  const dateKeywords = ['data', 'date', 'dt', 'datetime'];
  const descKeywords = ['descri', 'hist', 'memo', 'observ', 'description'];
  const amountKeywords = ['valor', 'amount', 'quantia', 'vlr'];

  const findColumn = (keywords: string[]) => {
    return headers.find(header => 
      keywords.some(keyword => 
        header.toLowerCase().includes(keyword.toLowerCase())
      )
    ) || '';
  };

  return {
    dateField: findColumn(dateKeywords),
    descriptionField: findColumn(descKeywords),
    amountField: findColumn(amountKeywords),
  };
}

function detectOFXMapping(availableFields: string[]): Partial<UniversalMapping> {
  return {
    dateField: availableFields.includes('date') ? 'date' : availableFields[0] || '',
    descriptionField: availableFields.includes('name') ? 'name' : 
                     availableFields.includes('memo') ? 'memo' : 
                     availableFields[0] || '',
    amountField: availableFields.includes('amount') ? 'amount' : availableFields[0] || '',
  };
}

function getMappingFields(fileType: 'csv' | 'ofx', preview: FilePreview | OFXPreview): MappingField[] {
  const isCSV = fileType === 'csv';
  const options: FieldOption[] = isCSV ? 
    (preview as FilePreview).headers.map((header, index) => ({
      value: header,
      label: header || `Coluna ${index + 1}`,
      sampleData: (preview as FilePreview).rows[0]?.[index] || 'N/A'
    })) :
    (preview as OFXPreview).availableFields.map(field => ({
      value: field,
      label: field.toUpperCase(),
      sampleData: (preview as OFXPreview).sampleTransaction[field] || 'N/A'
    }));

  return [
    {
      key: 'dateField',
      label: 'Campo da Data',
      description: 'Qual campo contém as datas das transações?',
      required: true,
      icon: 'calendar',
      options,
    },
    {
      key: 'descriptionField',
      label: 'Campo da Descrição',
      description: 'Qual campo contém a descrição das transações?',
      required: true,
      icon: 'file-text',
      options,
    },
    {
      key: 'amountField',
      label: 'Campo do Valor',
      description: 'Qual campo contém os valores das transações?',
      required: true,
      icon: 'dollar-sign',
      options,
    },
    {
      key: 'referenceField',
      label: 'Campo de Referência',
      description: 'Campo adicional para referência (opcional)',
      required: false,
      icon: 'hash',
      options: [{ value: '', label: 'Nenhum', description: 'Não usar campo de referência' }, ...options],
    },
  ];
}

function validateMapping(mapping: UniversalMapping, fileType: 'csv' | 'ofx'): boolean {
  return !!(mapping.dateField && mapping.descriptionField && mapping.amountField);
}