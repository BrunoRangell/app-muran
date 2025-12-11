import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutGrid, 
  Search, 
  ExternalLink, 
  Users, 
  Link2,
  Link2Off,
  LayoutTemplate,
  Eye,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ClientPortalData {
  id: string;
  client_id: string;
  access_token: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at: string | null;
}

interface ConfirmDialogState {
  open: boolean;
  clientId: string;
  companyName: string;
  slug: string;
  isValidating: boolean;
  isSlugAvailable: boolean;
  validationMessage: string;
}

const TrafficReportsDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingPortal, setCreatingPortal] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Buscar clientes ativos
  const { data: clientsData, isLoading: isLoadingClients } = useUnifiedData();

  // Buscar portais de todos os clientes
  const { data: portalsData } = useQuery({
    queryKey: ['all-client-portals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_portals')
        .select('id, client_id, access_token, is_active, access_count, last_accessed_at');
      
      if (error) throw error;
      return data as ClientPortalData[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar clientes ativos
  const activeClients = useMemo(() => {
    if (!clientsData) return [];
    return clientsData.filter(c => c.status === 'active');
  }, [clientsData]);

  // Filtrar por busca
  const filteredClients = useMemo(() => {
    if (!searchQuery) return activeClients;
    const query = searchQuery.toLowerCase();
    return activeClients.filter(c => 
      c.company_name.toLowerCase().includes(query)
    );
  }, [activeClients, searchQuery]);

  // Mapear portais por client_id
  const portalsMap = useMemo(() => {
    if (!portalsData) return new Map<string, ClientPortalData>();
    return new Map(portalsData.map(p => [p.client_id, p]));
  }, [portalsData]);

  const handleOpenPortal = (accessToken: string) => {
    window.open(`/cliente/${accessToken}`, '_blank');
  };

  const generateSlug = (companyName: string) => {
    return companyName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handlePreparePortal = async (clientId: string, companyName: string) => {
    const baseSlug = generateSlug(companyName);
    
    // Validar imediatamente se o slug está disponível
    const { data: existingPortal } = await supabase
      .from('client_portals')
      .select('access_token')
      .eq('access_token', baseSlug)
      .maybeSingle();
    
    setConfirmDialog({
      open: true,
      clientId,
      companyName,
      slug: baseSlug,
      isValidating: false,
      isSlugAvailable: !existingPortal,
      validationMessage: existingPortal ? 'Esta URL já está em uso' : 'URL disponível',
    });
  };

  const validateSlug = async (slug: string) => {
    if (!confirmDialog) return;
    
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (sanitizedSlug !== slug) {
      setConfirmDialog(prev => prev ? { ...prev, slug: sanitizedSlug } : null);
    }
    
    if (!sanitizedSlug) {
      setConfirmDialog(prev => prev ? { 
        ...prev, 
        isSlugAvailable: false, 
        validationMessage: 'URL não pode estar vazia',
        isValidating: false 
      } : null);
      return;
    }

    setConfirmDialog(prev => prev ? { ...prev, isValidating: true } : null);

    const { data: existingPortal } = await supabase
      .from('client_portals')
      .select('access_token')
      .eq('access_token', sanitizedSlug)
      .maybeSingle();

    setConfirmDialog(prev => prev ? {
      ...prev,
      isValidating: false,
      isSlugAvailable: !existingPortal,
      validationMessage: existingPortal ? 'Esta URL já está em uso' : 'URL disponível'
    } : null);
  };

  const handleCreatePortal = async () => {
    if (!confirmDialog) return;
    
    setCreatingPortal(confirmDialog.clientId);
    setConfirmDialog(null);
    
    try {
      // Obter o user_id atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }
      
      // Criar portal
      const { error } = await supabase
        .from('client_portals')
        .insert({
          client_id: confirmDialog.clientId,
          access_token: confirmDialog.slug,
          is_active: true,
          created_by: user.id,
        });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['all-client-portals'] });
      toast.success('Relatório criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast.error('Erro ao criar relatório');
    } finally {
      setCreatingPortal(null);
    }
  };

  const handleDeletePortal = async (portalId: string, companyName: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o relatório de "${companyName}"?`);
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('client_portals')
        .delete()
        .eq('id', portalId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['all-client-portals'] });
      toast.success('Relatório excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast.error('Erro ao excluir relatório');
    }
  };

  const getClientInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muran-primary to-muran-primary/80 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Central de Relatórios</h1>
              <p className="text-muted-foreground text-sm">
                Gerencie relatórios de tráfego dos clientes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/relatorios-trafego/templates")}
              className="gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Editor de Templates
            </Button>
            <Button 
              onClick={() => navigate("/relatorios-trafego/visualizar")}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Todos os Relatórios
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Clientes Ativos</span>
            </div>
            <p className="text-3xl font-bold">{activeClients.length}</p>
          </div>
          
          <div className="bg-card rounded-xl border p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <span className="text-sm">Relatórios Ativos</span>
            </div>
            <p className="text-3xl font-bold">
              {portalsData?.filter(p => p.is_active).length || 0}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[350px]">Cliente</TableHead>
                <TableHead className="w-[150px]">Relatório</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClients ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const portal = portalsMap.get(client.id);
                  
                  return (
                    <TableRow key={client.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Logo ou Inicial */}
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
                            <span className="text-lg font-bold text-muran-primary">
                              {getClientInitial(client.company_name)}
                            </span>
                          </div>
                          <span className="font-medium">{client.company_name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {portal ? (
                          <Badge 
                            variant={portal.is_active ? "default" : "secondary"}
                            className={portal.is_active ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}
                          >
                            {portal.is_active ? (
                              <><Link2 className="h-3 w-3 mr-1" /> Ativo</>
                            ) : (
                              <><Link2Off className="h-3 w-3 mr-1" /> Inativo</>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Não criado
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Criar Link - aparece quando não tem portal ou está inativo */}
                          {(!portal || !portal.is_active) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePreparePortal(client.id, client.company_name)}
                              disabled={creatingPortal === client.id}
                              className="gap-1.5"
                            >
                              <Link2 className="h-4 w-4" />
                              {creatingPortal === client.id ? 'Criando...' : 'Criar Link'}
                            </Button>
                          )}
                          
                          {/* Botão Ver Relatório - só aparece quando portal está ativo */}
                          {portal?.is_active && (
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenPortal(portal.access_token)}
                              className="gap-1.5"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver Relatório
                            </Button>
                          )}

                          {/* Botão Excluir - aparece quando portal existe */}
                          {portal && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePortal(portal.id, client.company_name)}
                              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar criação do relatório</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p>
                Defina a URL do relatório para <strong className="text-foreground">{confirmDialog?.companyName}</strong>:
              </p>
              <div className="space-y-3">
                {/* Prefix em linha separada para não cortar */}
                <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-md">
                  {window.location.origin}/cliente/
                </div>
                {/* Input com largura total */}
                <Input
                  value={confirmDialog?.slug || ''}
                  onChange={(e) => {
                    // Sanitizar em tempo real
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-');
                    setConfirmDialog(prev => prev ? { 
                      ...prev, 
                      slug: sanitized,
                      validationMessage: '',
                      isSlugAvailable: true
                    } : null);
                  }}
                  onBlur={() => validateSlug(confirmDialog?.slug || '')}
                  className="font-mono"
                  placeholder="url-do-cliente"
                />
                {/* Validação */}
                {confirmDialog?.validationMessage && (
                  <p className={`text-sm flex items-center gap-1 ${
                    confirmDialog.isSlugAvailable ? 'text-emerald-600' : 'text-destructive'
                  }`}>
                    {confirmDialog.isValidating ? (
                      <>Verificando...</>
                    ) : (
                      confirmDialog.validationMessage
                    )}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreatePortal}
              disabled={!confirmDialog?.isSlugAvailable || confirmDialog?.isValidating || !confirmDialog?.slug}
            >
              Criar Relatório
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrafficReportsDashboard;
