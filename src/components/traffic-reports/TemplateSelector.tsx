import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2, Sparkles } from "lucide-react";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: ReportTemplate | null) => void;
  onCustomize: () => void;
  clientId?: string;
}

export function TemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect, 
  onCustomize,
  clientId 
}: TemplateSelectorProps) {
  const { templates, isLoading } = useReportTemplates(clientId);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onTemplateSelect(null);
    } else {
      const template = templates.find(t => t.id === value);
      if (template) {
        onTemplateSelect(template);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-muran-primary" />
        <span className="text-sm font-medium">Template:</span>
      </div>
      
      <Select 
        value={selectedTemplateId || 'none'} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecione um template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Visualização Padrão</SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
              {template.is_global && " (Global)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onCustomize}
        disabled={!selectedTemplateId}
      >
        <Settings2 className="h-4 w-4 mr-2" />
        Personalizar
      </Button>
    </div>
  );
}
