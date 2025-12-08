import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedData } from "@/hooks/useUnifiedData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutGrid, 
  Search, 
  ExternalLink, 
  Settings2, 
  Users, 
  Eye,
  Link2,
  Link2Off,
  BarChart3
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientPortalData {
  id: string;
  client_id: string;
  access_token: string;
  is_active: boolean;
  access_count: number;
  last_accessed_at: string | null;
}

const TrafficReportsDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Buscar templates
  const { data: templatesData } = useQuery({
    queryKey: ['all-report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('id, name, client_id, is_global');
      
      if (error) throw error;
      return data;
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

  // Mapear templates por client_id
  const templatesMap = useMemo(() => {
    if (!templatesData) return new Map<string, { id: string; name: string }>();
    const map = new Map<string, { id: string; name: string }>();
    templatesData.forEach(t => {
      if (t.client_id) {
        map.set(t.client_id, { id: t.id, name: t.name });
      }
    });
    return map;
  }, [templatesData]);

  const globalTemplate = useMemo(() => {
    return templatesData?.find(t => t.is_global);
  }, [templatesData]);

  const handleOpenEditor = (clientId: string) => {
    navigate(`/relatorios-trafego/editor/${clientId}`);
  };

  const handleOpenPortal = (accessToken: string) => {
    window.open(`/cliente/${accessToken}`, '_blank');
  };

  const getClientInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muran-primary to-muran-primary/80 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-muran-primary to-muran-primary/70 bg-clip-text text-transparent">
                Central de Relatórios
              </h1>
              <p className="text-muted-foreground">
                Gerencie relatórios de tráfego e portais de clientes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <span className="text-sm">Portais Ativos</span>
            </div>
            <p className="text-3xl font-bold">
              {portalsData?.filter(p => p.is_active).length || 0}
            </p>
          </div>
          
          <div className="bg-card rounded-xl border p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Total de Acessos</span>
            </div>
            <p className="text-3xl font-bold">
              {portalsData?.reduce((acc, p) => acc + (p.access_count || 0), 0) || 0}
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
                <TableHead className="w-[300px]">Cliente</TableHead>
                <TableHead className="w-[120px]">Portal</TableHead>
                <TableHead className="w-[200px]">Template</TableHead>
                <TableHead className="w-[120px] text-center">Acessos</TableHead>
                <TableHead className="w-[180px]">Último Acesso</TableHead>
                <TableHead className="w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClients ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const portal = portalsMap.get(client.id);
                  const template = templatesMap.get(client.id);
                  const clientWithLogo = client as typeof client & { logo_url?: string };
                  
                  return (
                    <TableRow key={client.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Logo ou Inicial */}
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
                            {clientWithLogo.logo_url ? (
                              <img 
                                src={clientWithLogo.logo_url} 
                                alt={client.company_name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="text-lg font-bold text-muran-primary">
                                {getClientInitial(client.company_name)}
                              </span>
                            )}
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
                        {template ? (
                          <span className="text-sm">{template.name}</span>
                        ) : globalTemplate ? (
                          <span className="text-sm text-muted-foreground">
                            {globalTemplate.name} (global)
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Padrão</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{portal?.access_count || 0}</span>
                      </TableCell>
                      
                      <TableCell>
                        {portal?.last_accessed_at ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(portal.last_accessed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEditor(client.id)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar Relatório</TooltipContent>
                          </Tooltip>
                          
                          {portal?.is_active && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenPortal(portal.access_token)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Abrir Portal</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8 bg-muran-primary hover:bg-muran-primary/90"
                                onClick={() => handleOpenEditor(client.id)}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Relatório</TooltipContent>
                          </Tooltip>
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
    </div>
  );
};

export default TrafficReportsDashboard;
