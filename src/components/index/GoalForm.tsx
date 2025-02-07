
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format, formatISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GoalFormProps {
  initialData?: Partial<Goal>;
  onSubmit: (data: Partial<Goal>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const GoalForm = ({ initialData, onSubmit, onCancel, isSubmitting }: GoalFormProps) => {
  const [formData, setFormData] = useState<Partial<Goal>>(initialData || {});

  const handleDateChange = (date: Date | undefined, field: 'start_date' | 'end_date') => {
    if (!date) return;
    const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setFormData(prev => ({
      ...prev,
      [field]: formatISO(adjustedDate, { representation: 'date' })
    }));
  };

  const getMetricLabel = () => {
    switch (formData.goal_type) {
      case 'active_clients':
        return 'clientes ativos';
      case 'new_clients':
        return 'novos clientes';
      default:
        return 'clientes';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Tipo de Meta
        </label>
        <Select
          value={formData.goal_type}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              goal_type: value as Goal['goal_type'],
            })
          }
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GOAL_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Data Inicial</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 justify-start text-left font-normal text-sm",
                  !formData.start_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? (
                  format(new Date(formData.start_date), "dd/MM", { locale: ptBR })
                ) : (
                  <span>Início</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                onSelect={(date) => handleDateChange(date, 'start_date')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">Data Final</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 justify-start text-left font-normal text-sm",
                  !formData.end_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? (
                  format(new Date(formData.end_date), "dd/MM", { locale: ptBR })
                ) : (
                  <span>Término</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.end_date ? new Date(formData.end_date) : undefined}
                onSelect={(date) => handleDateChange(date, 'end_date')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Meta de {getMetricLabel()}
        </label>
        <Input
          type="number"
          placeholder="Digite a quantidade"
          value={formData.target_value || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              target_value: parseInt(e.target.value),
            })
          }
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="h-8"
          disabled={isSubmitting}
          size="sm"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          className="h-8 bg-[#ff6e00] hover:bg-[#e66200]"
          size="sm"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
};

