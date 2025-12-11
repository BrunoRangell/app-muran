import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy,
  LayoutGrid,
  TrendingUp,
  Users,
  Lock,
  Loader2
} from 'lucide-react';
import { useWidgetPresets, WidgetPreset } from '@/hooks/useWidgetPresets';
import { PresetEditorDialog } from './PresetEditorDialog';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface PresetManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  TrendingUp,
  Users,
};

export function PresetManagerDialog({ open, onOpenChange }: PresetManagerDialogProps) {
  const { presets, isLoading, deletePreset, duplicatePreset } = useWidgetPresets();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<WidgetPreset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingPreset(null);
    setEditorOpen(true);
  };

  const handleEdit = (preset: WidgetPreset) => {
    setEditingPreset(preset);
    setEditorOpen(true);
  };

  const handleDuplicate = (preset: WidgetPreset) => {
    duplicatePreset.mutate(preset);
  };

  const handleDelete = (id: string) => {
    deletePreset.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null)
    });
  };

  const presetToDelete = presets.find(p => p.id === deleteConfirmId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciar Blocos Rápidos</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum bloco rápido encontrado.</p>
                <p className="text-sm">Crie um novo bloco para começar.</p>
              </div>
            ) : (
              presets.map(preset => {
                const Icon = ICON_MAP[preset.icon] || LayoutGrid;
                
                return (
                  <div
                    key={preset.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      "bg-card hover:bg-accent/30 transition-colors",
                      preset.is_system && "border-primary/20 bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      "bg-gradient-to-br from-primary/20 to-primary/10"
                    )}>
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{preset.name}</h4>
                        {preset.is_system && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Lock className="w-2.5 h-2.5 mr-0.5" />
                            Sistema
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {preset.description || 'Sem descrição'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {preset.widgets.length} widget{preset.widgets.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(preset)}
                        title="Duplicar"
                        disabled={duplicatePreset.isPending}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      
                      {!preset.is_system && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(preset)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(preset.id)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleCreate} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Bloco Rápido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PresetEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        preset={editingPreset}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco rápido?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloco "{presetToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePreset.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
