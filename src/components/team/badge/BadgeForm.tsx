
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSelector } from "./IconSelector";

interface BadgeFormProps {
  name: string;
  description: string;
  icon: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onSubmit: () => void;
}

export function BadgeForm({
  name,
  description,
  icon,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onSubmit,
}: BadgeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome do Emblema *</label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Inovador do Mês"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição do Emblema *</label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descreva o significado deste emblema..."
          className="resize-none"
          rows={3}
        />
      </div>

      <IconSelector selectedIcon={icon} onSelectIcon={onIconChange} />

      <Button onClick={onSubmit} className="w-full">
        Criar e Dar Emblema
      </Button>
    </div>
  );
}
