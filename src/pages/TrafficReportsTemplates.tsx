import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReportTemplates, ReportTemplate } from "@/hooks/useReportTemplates";
import { premiumTemplates, PremiumTemplate } from "@/data/premiumTemplates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Globe, User, LayoutTemplate, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

const SECTION_LABELS: Record<string, string> = {
  overview: 'Visão Geral',
  demographics: 'Demografia',
  topCreatives: 'Top Criativos',
  conversionFunnel: 'Funil de Conversão',
  campaignTable: 'Tabela de Campanhas',
  trendCharts: 'Gráficos de Tendência',
};

const DEFAULT_SECTIONS = {
  overview: { enabled: true, order: 1 },
  demographics: { enabled: true, order: 2 },
  topCreatives: { enabled: true, order: 3, limit: 5 },
  conversionFunnel: { enabled: true, order: 4 },
  campaignTable: { enabled: true, order: 5 },
  trendCharts: { enabled: true, order: 6 },
};

const TrafficReportsTemplates = () => {
  const navigate = useNavigate();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useReportTemplates();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ReportTemplate | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  const handleOpenCreate = () => {
    // Navegar para o novo editor visual
    navigate("/relatorios-trafego/templates/novo");
  };

  const handleOpenEdit = (template: ReportTemplate) => {
    // Navegar para o editor visual com o template
    navigate(`/relatorios-trafego/templates/editar/${template.id}`);
  };

  const handleSectionToggle = (sectionKey: string, enabled: boolean) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof typeof prev],
        enabled
      }
    }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    const templateData = {
      name: name.trim(),
      is_global: isGlobal,
      client_id: null,
      sections,
    };

    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, ...templateData }, {
        onSuccess: () => {
          toast.success("Template atualizado com sucesso");
          setDialogOpen(false);
        },
        onError: () => {
          toast.error("Erro ao atualizar template");
        }
      });
    } else {
      createTemplate(templateData, {
        onSuccess: () => {
          toast.success("Template criado com sucesso");
          setDialogOpen(false);
        },
        onError: () => {
          toast.error("Erro ao criar template");
        }
      });
    }
  };

  const handleDelete = () => {
    if (!templateToDelete) return;
    
    deleteTemplate(templateToDelete.id, {
      onSuccess: () => {
        toast.success("Template excluído com sucesso");
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
      },
      onError: () => {
        toast.error("Erro ao excluir template");
      }
    });
  };

  const getEnabledSectionsCount = (template: ReportTemplate) => {
    const secs = template.sections as typeof DEFAULT_SECTIONS;
    return Object.values(secs).filter(s => s.enabled).length;
  };

  const handleUsePremiumTemplate = (premiumTemplate: PremiumTemplate) => {
    // Navegar para o editor com o template premium pré-carregado
    navigate(`/relatorios-trafego/templates/novo?preset=${premiumTemplate.id}`);
  };

  const getCategoryLabel = (category: PremiumTemplate['category']) => {
    switch (category) {
      case 'performance': return 'Conversões';
      case 'awareness': return 'Alcance';
      case 'ecommerce': return 'E-commerce';
      default: return category;
    }
  };

  const getCategoryColor = (category: PremiumTemplate['category']) => {
    switch (category) {
      case 'performance': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'awareness': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'ecommerce': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/relatorios-trafego")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editor de Templates</h1>
            <p className="text-muted-foreground text-sm">
              Crie e gerencie templates para personalizar seus relatórios
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Premium Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#ff6e00]" />
          <h2 className="text-lg font-semibold">Templates Prontos</h2>
          <Badge variant="secondary" className="bg-[#ff6e00]/10 text-[#ff6e00] border-[#ff6e00]/20">
            Novo
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Comece com templates profissionais e personalize conforme sua necessidade
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {premiumTemplates.map(template => (
            <Card 
              key={template.id} 
              className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-[#ff6e00]/30 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/60" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-4">
                  <Badge 
                    variant="outline" 
                    className={getCategoryColor(template.category)}
                  >
                    {getCategoryLabel(template.category)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {template.widgets.length} widgets
                  </Badge>
                </div>
                <Button 
                  className="w-full gap-2 bg-[#ff6e00] hover:bg-[#ff6e00]/90"
                  onClick={() => handleUsePremiumTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                  Usar Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Seus Templates Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Seus Templates</h2>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template para personalizar a exibição dos relatórios
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      {template.is_global ? (
                        <>
                          <Globe className="h-3.5 w-3.5" />
                          Template Global
                        </>
                      ) : (
                        <>
                          <User className="h-3.5 w-3.5" />
                          Template de Cliente
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {getEnabledSectionsCount(template)} seções
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Object.entries(template.sections as typeof DEFAULT_SECTIONS)
                    .filter(([_, config]) => config.enabled)
                    .map(([key]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {SECTION_LABELS[key]}
                      </Badge>
                    ))}
                </div>
                <Separator className="mb-3" />
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5"
                    onClick={() => handleOpenEdit(template)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setTemplateToDelete(template);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Configure quais seções serão exibidas no relatório
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Relatório Executivo"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="global"
                checked={isGlobal}
                onCheckedChange={(checked) => setIsGlobal(!!checked)}
              />
              <Label htmlFor="global" className="text-sm">
                Template global (disponível para todos os clientes)
              </Label>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Seções do Relatório</Label>
              <div className="space-y-2">
                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={key}
                      checked={sections[key as keyof typeof sections]?.enabled ?? true}
                      onCheckedChange={(checked) => handleSectionToggle(key, !!checked)}
                    />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrafficReportsTemplates;
