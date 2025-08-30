import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, DollarSign, Hash, AlertCircle } from "lucide-react";
import { FieldOption, MappingField } from "../types/mapping";

interface MappingFieldCardProps {
  field: MappingField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  isValid: boolean;
  className?: string;
}

const iconMap = {
  calendar: Calendar,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  hash: Hash,
};

export function MappingFieldCard({
  field,
  value,
  onChange,
  isValid,
  className = "",
}: MappingFieldCardProps) {
  const Icon = iconMap[field.icon as keyof typeof iconMap] || FileText;
  const currentValue = Array.isArray(value) ? value[0] : value;

  return (
    <Card className={`relative transition-all duration-200 ${className} ${
      !isValid && field.required 
        ? 'border-destructive bg-destructive/5' 
        : isValid && currentValue 
        ? 'border-primary bg-primary/5' 
        : 'border-border'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            !isValid && field.required 
              ? 'bg-destructive/20 text-destructive' 
              : isValid && currentValue 
              ? 'bg-primary/20 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {field.label}
              {field.required && (
                <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {field.description}
            </CardDescription>
          </div>
          {!isValid && field.required && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Select value={currentValue || ""} onValueChange={onChange}>
          <SelectTrigger className={`w-full ${
            !isValid && field.required ? 'border-destructive' : ''
          }`}>
            <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                  {option.sampleData && (
                    <span className="text-xs text-primary">
                      Exemplo: {option.sampleData}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}