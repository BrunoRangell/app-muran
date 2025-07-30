
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

interface TeamMemberCheckProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const TeamMemberCheck = ({ children, requireAdmin = false }: TeamMemberCheckProps) => {
  const [isTeamMember, setIsTeamMember] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkTeamMembership = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsTeamMember(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: teamMember, error } = await supabase
          .from('team_members')
          .select('id, permission, role')
          .eq('manager_id', session.user.id)
          .single();

        if (error) {
          console.log("Usuário não é membro da equipe:", error);
          setIsTeamMember(false);
          setIsAdmin(false);
        } else {
          setIsTeamMember(true);
          setIsAdmin(teamMember.permission === 'admin');
        }
      } catch (error) {
        console.error("Erro ao verificar membro da equipe:", error);
        setIsTeamMember(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeamMembership();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff6e00]"></div>
      </div>
    );
  }

  if (!isTeamMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Acesso Negado</div>
            <div className="text-sm">
              Você não é membro da equipe Muran. Entre em contato com um administrador para obter acesso.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert className="max-w-md border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-semibold mb-2">Privilégios Insuficientes</div>
            <div className="text-sm">
              Esta funcionalidade requer privilégios de administrador. Entre em contato com um administrador se precisar de acesso.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
