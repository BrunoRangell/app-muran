
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSelector } from "./IconSelector";
import { Award } from "lucide-react";

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
    <div className="space-y-6 bg-white rounded-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Nome do Emblema *</label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Inovador do Mês"
          className="border-gray-200 focus:border-muran-primary focus:ring-muran-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Descrição do Emblema *</label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descreva o significado e a importância deste emblema..."
          className="resize-none h-24 border-gray-200 focus:border-muran-primary focus:ring-muran-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Ícone do Emblema</label>
        <IconSelector selectedIcon={icon} onSelectIcon={onIconChange} />
      </div>

      <Button 
        onClick={onSubmit} 
        className="w-full bg-muran-primary hover:bg-muran-primary/90 gap-2"
      >
        <Award className="h-4 w-4" />
        Criar e Dar Emblema
      </Button>
    </div>
  );
}

