import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useImportantDates } from "@/hooks/useImportantDates";
import { ImportantDate } from "@/types/importantDate";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditDateDialogProps {
  date: ImportantDate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditDateDialog = ({ date, open, onOpenChange }: EditDateDialogProps) => {
  const { updateDate } = useImportantDates();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    date_type: date.date_type,
    title: date.title,
    description: date.description || "",
    date: date.date,
    is_recurring: date.is_recurring,
    recurrence_pattern: date.recurrence_pattern || "none",
  });

  useEffect(() => {
    if (date.date) {
      setSelectedDate(parseISO(date.date));
    }
  }, [date.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDate.mutateAsync({
      id: date.id,
      ...formData,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : formData.date,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Data</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião trimestral"
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="edit-date_type">Tipo *</Label>
            <Select
              value={formData.date_type}
              onValueChange={(value) => setFormData({ ...formData, date_type: value as 'birthday' | 'anniversary' | 'holiday' | 'meeting' | 'deadline' | 'other' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Aniversário</SelectItem>
                <SelectItem value="anniversary">Aniversário de Empresa/Parceria</SelectItem>
                <SelectItem value="holiday">Feriado/Data Comercial</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="deadline">Prazo</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data com DatePicker */}
          <div>
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Recorrência */}
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-recurring">Data recorrente (anual)</Label>
            <Switch
              id="edit-recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  is_recurring: checked,
                  recurrence_pattern: checked ? "yearly" : "none",
                })
              }
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="edit-description">Descrição (opcional)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateDate.isPending}>
              {updateDate.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
