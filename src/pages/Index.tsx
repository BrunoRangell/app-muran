import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { CompanyCards } from "@/components/index/CompanyCards";
import { MetricsCard } from "@/components/index/MetricsCard";
import { BirthdayCard } from "@/components/team/BirthdayCard";
import { GoalCard } from "@/components/index/GoalCard";
import { Quote } from "lucide-react";
import { DashboardLoadingState } from "@/components/loading-states/DashboardLoadingState";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { AuthDebugger } from "@/components/auth/AuthDebugger";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  // Usar hook unificado de autenticação
  const { session, user, isAuthenticated, isLoading: isAuthLoading, isRevalidating } = useUnifiedAuth();

  const { data: teamMembers, isLoading: isTeamLoading } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: clientMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["client_metrics"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: activeClients, error: activeError } = await supabase
        .from("clients")
        .select("count")
        .eq("status", "active")
        .single();

      if (activeError) throw activeError;

      const { data: newClients, error: newError } = await supabase
        .from("clients")
        .select("count")
        .eq("status", "active")
        .gte("first_payment_date", monthStart.toISOString())
        .lte("first_payment_date", monthEnd.toISOString())
        .single();

      if (newError) throw newError;

      return {
        activeCount: activeClients?.count || 0,
        newCount: newClients?.count || 0,
      };
    },
  });

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Bom dia";
      if (hour < 18) return "Boa tarde";
      return "Boa noite";
    };

    const fetchUserData = async () => {
      try {
        setIsUserLoading(true);
        console.log("🔍 Buscando dados do usuário...");
        
        // Aguardar que tenhamos uma sessão válida
        if (!session || !user?.email) {
          console.log("⚠️ Sessão ou email não disponível ainda");
          setUserName("Usuário");
          return;
        }

        console.log("✅ Sessão disponível, buscando team member para:", user.email);
        console.log("🔍 Auth UID da sessão:", user.id);
        
        const { data: teamMember, error: memberError } = await supabase
          .from("team_members")
          .select("name, role, photo_url")
          .eq("email", user.email)
          .single();

        if (memberError) {
          console.error("❌ Erro ao buscar membro da equipe:", memberError);
          setUserName("Usuário");
          return;
        }

        if (teamMember) {
          const firstName = teamMember.name?.split(" ")[0] || "Usuário";
          setUserName(firstName);
          setUserRole(teamMember.role || "");
          setAvatarUrl(teamMember.photo_url || "");
          
          // Verificar roles usando user_roles table
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          const userIsAdmin = roles?.some(r => r.role === 'admin') || false;
          setIsAdmin(userIsAdmin);
          
          console.log("✅ Dados do usuário carregados:", { 
            firstName, 
            role: teamMember.role, 
            isAdmin: userIsAdmin,
            email: user.email 
          });
        } else {
          console.log("⚠️ Nenhum membro da equipe encontrado");
          setUserName("Usuário");
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do usuário:", error);
        setUserName("Usuário");
      } finally {
        setIsUserLoading(false);
      }
    };

    setGreeting(getGreeting());
    
    // Só buscar dados se tivermos sessão autenticada
    if (isAuthenticated && session && user) {
      fetchUserData();
    } else if (!isAuthLoading) {
      console.log("⚠️ Sem autenticação válida, definindo usuário padrão");
      setUserName("Usuário");
      setIsUserLoading(false);
    }
  }, [session, user, isAuthenticated, isAuthLoading]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const todaysQuote = getRandomQuote();

  if (isTeamLoading || isMetricsLoading || isUserLoading || isAuthLoading) {
    return <DashboardLoadingState />;
  }

  // Se não estiver autenticado, mostrar debugger
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <AuthDebugger />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6 relative">
      {isRevalidating && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-muran-primary/20 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-muran-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muran-complementary">Atualizando...</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-muran-primary/20">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-[#ff6e00] text-white text-xl">
                  {getInitials(userName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-muran-complementary">
                {greeting}, {userName || "Usuário"}!
              </h1>
              <p className="text-gray-600">É muito bom ter você na Muran!</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <Quote className="h-5 w-5 text-muran-primary/50 shrink-0" />
          <p className="text-sm text-gray-600 italic">
            "{todaysQuote.quote}" 
            <span className="text-xs text-gray-500 ml-1">
              - {todaysQuote.author}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <CompanyCards />
        </div>

        <div className="lg:col-span-3">
          <GoalCard isAdmin={isAdmin} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MetricsCard clientMetrics={clientMetrics} />
        </div>
        
        <div className="lg:col-span-2">
          {teamMembers && <BirthdayCard members={teamMembers} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
