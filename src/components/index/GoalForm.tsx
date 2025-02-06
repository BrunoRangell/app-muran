import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, GOAL_TYPES } from "@/types/goal";
import { format } from "date-fns";
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

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muran-primary" />
          <h3 className="font-semibold">Tipo de Meta</h3>
        </div>
        <Select
          value={formData.goal_type}
          onValueChange={(value) => 
            setFormData({ 
              ...formData, 
              goal_type: value as Goal['goal_type']
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de meta" />
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muran-primary" />
          <h3 className="font-semibold">Período da Meta</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
                  <span>Data inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                onSelect={(date) =>
                  setFormData({ 
                    ...formData, 
                    start_date: date ? format(date, 'yyyy-MM-dd') : undefined 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

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
                  <span>Data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.end_date ? new Date(formData.end_date) : undefined}
                onSelect={(date) =>
                  setFormData({ 
                    ...formData, 
                    end_date: date ? format(date, 'yyyy-MM-dd') : undefined 
                  })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muran-primary" />
          <h3 className="font-semibold">Valor da Meta</h3>
        </div>
        <Input
          type="number"
          placeholder="Digite o valor da meta"
          value={formData.target_value || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              target_value: parseInt(e.target.value) || 0,
            })
          }
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};
