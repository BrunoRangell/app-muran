import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Target } from "lucide-react";
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
    
    // Corrige o problema de timezone
    const adjustedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    setFormData(prev => ({
      ...prev,
      [field]: formatISO(adjustedDate, { representation: 'date' })
    }));
  };

  return (
    <div className="space-y-8">
      {/* Tipo de Meta */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Desafio
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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de desafio" />
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

      {/* Período */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Período do Desafio
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? (
                    format(new Date(formData.start_date), "dd 'de' MMMM", { locale: ptBR })
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

          <div className="space-y-2">
            <label className="text-xs text-gray-500">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? (
                    format(new Date(formData.end_date), "dd 'de' MMMM", { locale: ptBR })
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
      </div>

      {/* Valor da Meta */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Objetivo do Desafio
        </label>
        <Input
          type="number"
          placeholder="Defina o objetivo"
          value={formData.target_value || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              target_value: parseInt(e.target.value),
            })
          }
          className="w-full"
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isSubmitting ? "Salvando..." : "Salvar Desafio"}
        </Button>
      </div>
    </div>
  );
};