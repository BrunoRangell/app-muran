import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AuthDebugger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      // 1. Verificar sessão local
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // 2. Verificar auth.uid() no servidor
      const { data: authUidData, error: authUidError } = await supabase
        .rpc('get_current_user_role');
      
      // 3. Verificar RLS functions
      const { data: rlsData, error: rlsError } = await supabase
        .from('team_members')
        .select('email')
        .limit(1);

      setDebugInfo({
        localSession: {
          exists: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          error: sessionError?.message
        },
        serverAuth: {
          authUid: authUidData,
          error: authUidError?.message
        },
        rlsTest: {
          success: !rlsError,
          error: rlsError?.message
        }
      });
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      toast({
        title: "Erro no diagnóstico",
        description: "Ocorreu um erro ao executar o diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefresh = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }
      
      toast({
        title: "Sessão atualizada",
        description: "Tentativa de refresh da sessão concluída."
      });
      
      // Executar diagnóstico novamente
      await runDiagnostic();
    } catch (error) {
      toast({
        title: "Erro no refresh",
        description: "Não foi possível atualizar a sessão.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const forceLogout = async () => {
    setIsLoading(true);
    try {
      // Limpar tudo
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logout realizado",
        description: "Faça login novamente para resolver os problemas de autenticação."
      });
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Diagnóstico de Autenticação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Detectamos problemas de autenticação que estão impedindo o acesso aos dados. 
            Use as ferramentas abaixo para diagnosticar e resolver.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Executar Diagnóstico"}
          </Button>
          <Button variant="outline" onClick={forceRefresh} disabled={isLoading}>
            Atualizar Sessão
          </Button>
          <Button variant="destructive" onClick={forceLogout} disabled={isLoading}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout e Relogar
          </Button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Resultado do Diagnóstico:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};