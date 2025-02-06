import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, GOAL_TYPES } from "@/types/goal";

interface GoalFormProps {
  initialData?: Partial<Goal>;
  onSubmit: (data: Partial<Goal>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const GoalForm = ({ initialData, onSubmit, onCancel, isSubmitting }: GoalFormProps) => {
  const [formData, setFormData] = useState<Partial<Goal>>(initialData || {});

  return (
    <div className="space-y-4">
      <Select
        value={formData.goal_type}
        onValueChange={(value) => 
          setFormData({ 
            ...formData, 
            goal_type: value as Goal['goal_type']
          })
        }
      >
        <SelectTrigger>
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

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={formData.start_date || ""}
          onChange={(e) =>
            setFormData({ ...formData, start_date: e.target.value })
          }
        />
        <Input
          type="date"
          value={formData.end_date || ""}
          onChange={(e) =>
            setFormData({ ...formData, end_date: e.target.value })
          }
        />
      </div>

      <Input
        type="number"
        placeholder="Valor da meta"
        value={formData.target_value || ""}
        onChange={(e) =>
          setFormData({
            ...formData,
            target_value: parseInt(e.target.value),
          })
        }
      />

      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          className="w-full"
        >
          Salvar
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