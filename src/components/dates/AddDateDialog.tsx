import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus } from "lucide-react";
import { useState } from "react";
import { useImportantDates } from "@/hooks/useImportantDates";
import { ImportantDateFormData } from "@/types/importantDate";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AddDateDialogProps {
  entityType?: 'client' | 'team' | 'custom';
  entityId?: string;
  entityName?: string;
  trigger?: React.ReactNode;
}

export const AddDateDialog = ({ entityType = 'custom', entityId, entityName, trigger }: AddDateDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createDate } = useImportantDates();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<ImportantDateFormData>({
    entity_type: entityType,
    entity_id: entityId,
    date_type: 'other',
    title: '',
    description: '',
    date: '',
    is_recurring: false,
    recurrence_pattern: 'none'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateToSubmit = selectedDate ? format(selectedDate, "yyyy-MM-dd") : formData.date;
    await createDate.mutateAsync({ ...formData, date: dateToSubmit });
    setOpen(false);
    // Reset form
    setFormData({
      entity_type: entityType,
      entity_id: entityId,
      date_type: 'other',
      title: '',
      description: '',
      date: '',
      is_recurring: false,
      recurrence_pattern: 'none'
    });
    setSelectedDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adicionar Data Importante
            {entityName && <span className="text-sm font-normal text-muted-foreground ml-2">para {entityName}</span>}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião trimestral"
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="date_type">Tipo *</Label>
            <Select value={formData.date_type} onValueChange={(value) => setFormData({ ...formData, date_type: value })}>
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
            <Label htmlFor="recurring">Data recorrente (anual)</Label>
            <Switch
              id="recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => 
                setFormData({ 
                  ...formData, 
                  is_recurring: checked,
                  recurrence_pattern: checked ? 'yearly' : 'none'
                })
              }
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDate.isPending}>
              {createDate.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
