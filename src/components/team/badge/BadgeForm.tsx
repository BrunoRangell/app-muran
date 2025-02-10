
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSelector } from "./IconSelector";
import { Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BadgeFormProps {
  name: string;
  description: string;
  icon: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onSubmit: () => void;
  selectedMemberId?: string;
}

export function BadgeForm({
  name,
  description,
  icon,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onSubmit,
  selectedMemberId,
}: BadgeFormProps) {
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedMemberId) {
      toast({
        title: "Selecione um membro",
        description: "Por favor, selecione um membro da equipe antes de criar o emblema.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o emblema.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, insira uma descrição para o emblema.",
        variant: "destructive",
      });
      return;
    }

    if (!icon) {
      toast({
        title: "Ícone obrigatório",
        description: "Por favor, selecione um ícone para o emblema.",
        variant: "destructive",
      });
      return;
    }

    onSubmit();
  };

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
        <label className="text-sm font-medium text-gray-700">Ícone do Emblema *</label>
        <IconSelector selectedIcon={icon} onSelectIcon={onIconChange} />
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full bg-muran-primary hover:bg-muran-primary/90 gap-2"
      >
        <Award className="h-4 w-4" />
        Criar e Dar Emblema
      </Button>
    </div>
  );
}
