import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientPortal {
  id: string;
  client_id: string;
  access_token: string;
  is_active: boolean;
  default_platform: string;
  default_period: number;
  allow_period_change: boolean;
  allow_platform_change: boolean;
  last_accessed_at: string | null;
  access_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PortalWithClient extends ClientPortal {
  clients: {
    id: string;
    company_name: string;
  };
}

// Gerar slug a partir do nome da empresa
function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
}

// Verificar se slug existe e adicionar sufixo se necessário
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('client_portals')
      .select('id')
      .eq('access_token', slug)
      .maybeSingle();
    
    if (!data) break;
    
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

// Hook para buscar portal de um cliente específico
export function useClientPortalByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-portal', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('client_portals')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientPortal | null;
    },
    enabled: !!clientId,
  });
}

// Hook para buscar portal por token (usado na página pública)
export function useClientPortalByToken(token: string | undefined) {
  return useQuery({
    queryKey: ['client-portal-token', token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('client_portals')
        .select(`
          *,
          clients (
            id,
            company_name
          )
        `)
        .eq('access_token', token)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as PortalWithClient | null;
    },
    enabled: !!token,
  });
}

// Hook para criar/gerenciar portal
export function useManageClientPortal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPortal = useMutation({
    mutationFn: async ({ 
      clientId, 
      userId,
      companyName 
    }: { 
      clientId: string; 
      userId: string;
      companyName: string;
    }) => {
      const baseSlug = generateSlug(companyName);
      const slug = await getUniqueSlug(baseSlug);
      
      const { data, error } = await supabase
        .from('client_portals')
        .insert({
          client_id: clientId,
          access_token: slug,
          created_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientPortal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', data.client_id] });
      toast({
        title: "Link criado!",
        description: "O link do portal foi gerado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePortal = useMutation({
    mutationFn: async ({ 
      portalId, 
      isActive 
    }: { 
      portalId: string; 
      isActive: boolean;
    }) => {
      const { data, error } = await supabase
        .from('client_portals')
        .update({ is_active: isActive })
        .eq('id', portalId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientPortal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', data.client_id] });
      toast({
        title: data.is_active ? "Link ativado!" : "Link desativado",
        description: data.is_active 
          ? "O cliente pode acessar o relatório novamente." 
          : "O cliente não pode mais acessar o relatório.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async ({ portalId, companyName }: { portalId: string; companyName: string }) => {
      const baseSlug = generateSlug(companyName);
      const newSlug = await getUniqueSlug(baseSlug);
      
      const { data, error } = await supabase
        .from('client_portals')
        .update({ 
          access_token: newSlug,
          access_count: 0,
          last_accessed_at: null 
        })
        .eq('id', portalId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientPortal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', data.client_id] });
      toast({
        title: "Link regenerado!",
        description: "O link anterior foi invalidado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const trackAccess = useMutation({
    mutationFn: async (token: string) => {
      // Buscar portal e incrementar contador manualmente
      const { data: portal } = await supabase
        .from('client_portals')
        .select('id, access_count')
        .eq('access_token', token)
        .maybeSingle();
      
      if (portal) {
        await supabase
          .from('client_portals')
          .update({ 
            access_count: (portal.access_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', portal.id);
      }
    },
  });

  return {
    createPortal,
    togglePortal,
    regenerateToken,
    trackAccess,
  };
}
