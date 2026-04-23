import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Copy, ChevronUp, ChevronDown, Crown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useReportTemplates } from '@/hooks/useReportTemplates';
import { usePremiumBuilder } from './usePremiumBuilder';
import { PREMIUM_BLOCK_LIST, getPremiumBlockDefinition } from './registry';
import { PremiumRenderer } from './PremiumRenderer';
import { PremiumPropertiesPanel } from './PremiumPropertiesPanel';
import { MOCK_DATA } from './mockData';
import { adaptToPremiumV2 } from './legacyAdapter';
import { cn } from '@/lib/utils';

export function PremiumBuilder() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const isEditing = !!templateId;
  const { templates, createTemplateAsync, updateTemplateAsync, isCreating, isUpdating } = useReportTemplates();
  const isSaving = isCreating || isUpdating;

  const builder = usePremiumBuilder();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isEditing || loaded || templates.length === 0) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const v2 = adaptToPremiumV2(tpl.sections);
    if (v2) {
      builder.load(v2, tpl.name, tpl.is_global);
    } else {
      toast.error('Este template não é premium-v2 — abra-o no editor padrão.');
      navigate('/relatorios-trafego/templates');
    }
    setLoaded(true);
  }, [isEditing, templates, templateId, loaded, builder, navigate]);

  const selectedDef = builder.selected ? getPremiumBlockDefinition(builder.selected.type) : null;

  const handleSave = async () => {
    if (!builder.name.trim()) {
      toast.error('Dê um nome ao template');
      return;
    }
    if (builder.template.blocks.length === 0) {
      toast.error('Adicione ao menos um bloco');
      return;
    }
    try {
      const payload = {
        name: builder.name.trim(),
        is_global: builder.isGlobal,
        client_id: null,
        sections: builder.template as any,
      };
      if (isEditing && templateId) {
        await updateTemplateAsync({ id: templateId, ...payload });
        toast.success('Template premium atualizado');
      } else {
        const created = await createTemplateAsync(payload);
        toast.success('Template premium criado');
        navigate(`/relatorios-trafego/templates/premium/editar/${created.id}`, { replace: true });
      }
      builder.setIsDirty(false);
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message || e}`);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0B0F1A] text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0B0F1A]/95 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            className="text-white/60 hover:text-white hover:bg-white/5"
            onClick={() => navigate('/relatorios-trafego/templates')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Crown className="h-5 w-5 text-[#ff6e00]" />
          <Input
            value={builder.name}
            onChange={(e) => { builder.setName(e.target.value); builder.setIsDirty(true); }}
            className="w-72 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="Nome do template"
          />
          <div className="flex items-center gap-2 ml-2">
            <Switch
              checked={builder.isGlobal}
              onCheckedChange={(v) => { builder.setIsGlobal(v); builder.setIsDirty(true); }}
            />
            <Label className="text-xs text-white/60">Global</Label>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Switch
              checked={builder.template.showSidebar}
              onCheckedChange={builder.setShowSidebar}
            />
            <Label className="text-xs text-white/60">Sidebar</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {builder.isDirty && <span className="text-xs text-amber-400">Não salvo</span>}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#ff6e00] hover:bg-[#ff6e00]/90 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Biblioteca */}
        <aside className="border-r border-white/[0.06] bg-[#0F1320] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Biblioteca Premium</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              {PREMIUM_BLOCK_LIST.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    onClick={() => builder.addBlock(def.type)}
                    className="group w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#ff6e00]/30 transition-all p-3 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6e00]/20 to-[#ff6e00]/5 border border-white/10">
                      <Icon className="h-4 w-4 text-[#ff6e00]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{def.name}</p>
                      <p className="text-[11px] text-white/40 line-clamp-2">{def.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-white/30 group-hover:text-[#ff6e00] shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Canvas com preview ao vivo */}
        <main className="overflow-auto bg-[#0B0F1A]">
          <div className="min-h-full p-6">
            {builder.template.blocks.length === 0 ? (
              <div className="h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Crown className="h-12 w-12 text-[#ff6e00]/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Comece arrastando um bloco</h3>
                  <p className="text-sm text-white/40">
                    Use a biblioteca à esquerda para adicionar blocos premium ao seu template.
                    Clique em um bloco no canvas para editá-lo.
                  </p>
                </div>
              </div>
            ) : (
              <PremiumRenderer
                template={builder.template}
                data={MOCK_DATA}
                embedded
                blockWrapper={(block, content) => (
                  <div
                    onClick={(e) => { e.stopPropagation(); builder.setSelectedId(block.id); }}
                    className={cn(
                      'h-full w-full relative cursor-pointer rounded-2xl transition-all',
                      builder.selectedId === block.id
                        ? 'ring-2 ring-[#ff6e00] ring-offset-2 ring-offset-[#0B0F1A]'
                        : 'hover:ring-1 hover:ring-white/20',
                    )}
                  >
                    {content}
                    {builder.selectedId === block.id && (
                      <div className="absolute -top-3 right-2 flex gap-1 z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); builder.moveBlock(block.id, 'up'); }}
                          className="h-6 w-6 rounded-md bg-[#0B0F1A] border border-white/20 text-white/70 hover:text-white flex items-center justify-center"
                        ><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); builder.moveBlock(block.id, 'down'); }}
                          className="h-6 w-6 rounded-md bg-[#0B0F1A] border border-white/20 text-white/70 hover:text-white flex items-center justify-center"
                        ><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); builder.duplicateBlock(block.id); }}
                          className="h-6 w-6 rounded-md bg-[#0B0F1A] border border-white/20 text-white/70 hover:text-white flex items-center justify-center"
                        ><Copy className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); builder.removeBlock(block.id); }}
                          className="h-6 w-6 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 flex items-center justify-center"
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                )}
              />
            )}
          </div>
        </main>

        {/* Painel de propriedades */}
        <aside className="border-l border-white/[0.06] bg-[#0F1320] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Propriedades</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_label]:text-white/70 [&_button]:text-white">
              {builder.selected && selectedDef ? (
                <PremiumPropertiesPanel
                  block={builder.selected}
                  definition={selectedDef}
                  onChange={(patch) => builder.updateBlockConfig(builder.selected!.id, patch)}
                  onLayoutChange={(patch) => builder.updateLayout(builder.selected!.id, patch)}
                />
              ) : (
                <p className="text-sm text-white/40 text-center py-8">
                  Selecione um bloco no canvas para editar
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
