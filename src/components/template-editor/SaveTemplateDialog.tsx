import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialIsGlobal: boolean;
  isSaving: boolean;
  onSave: (name: string, isGlobal: boolean) => void;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  initialName,
  initialIsGlobal,
  isSaving,
  onSave
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(initialName);
  const [isGlobal, setIsGlobal] = useState(initialIsGlobal);

  // Sincronizar com valores iniciais quando o dialog abrir
  useEffect(() => {
    if (open) {
      setName(initialName);
      setIsGlobal(initialIsGlobal);
    }
  }, [open, initialName, initialIsGlobal]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), isGlobal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Relatório Mensal Completo"
              autoFocus
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-global-save">Template global</Label>
              <p className="text-xs text-muted-foreground">
                Disponível para todos os clientes
              </p>
            </div>
            <Switch
              id="is-global-save"
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
