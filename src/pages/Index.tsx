import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { BirthdayCard } from "@/components/team/BirthdayCard";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { startOfMonth, endOfMonth } from "date-fns";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  const { data: teamMembers } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: clientMetrics } = useQuery({
    queryKey: ["client_metrics"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: activeClients, error: activeError } = await supabase
        .from('clients')
        .select('count')
        .eq('status', 'active')
        .single();

      if (activeError) throw activeError;

      const { data: newClients, error: newError } = await supabase
        .from('clients')
        .select('count')
        .eq('status', 'active')
        .gte('first_payment_date', monthStart.toISOString())
        .lte('first_payment_date', monthEnd.toISOString())
        .single();

      if (newError) throw newError;

      return {
        activeCount: activeClients?.count || 0,
        newCount: newClients?.count || 0
      };
    }
  });

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Bom dia";
      if (hour < 18) return "Boa tarde";
      return "Boa noite";
    };

    const fetchUserName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('name')
            .eq('email', session.user.email)
            .single();

          if (teamMember?.name) {
            setUserName(teamMember.name.split(' ')[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar nome do usuário:", error);
      }
    };

    setGreeting(getGreeting());
    fetchUserName();
  }, []);

  const todaysQuote = getRandomQuote();

  return (
    <div className="min-h-screen bg-[#0f0f15] p-6 relative overflow-hidden isolate">
      {/* Efeitos de Fundo */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#160B21] via-[#0F0819] to-[#1A0B2E]" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF6E00]/15 via-[#FF6E00]/05 to-transparent" />
        
        {/* Padrão Geométrico */}
        <svg viewBox="0 0 100 100" className="absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-5">
          <defs>
            <linearGradient id="geoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6E00" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF914D" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon
            points="50,0 100,50 50,100 0,50"
            fill="url(#geoGradient)"
            transform="rotate(45 50 50)"
          />
        </svg>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6e00] to-[#ff914d] animate-textGlow">
            {greeting}, {userName || 'Bem-vindo'}
            <Zap className="inline-block ml-3 animate-pulse" />
          </h1>
          <p className="text-[#ffffffcc] font-medium">
            É ótimo ter você aqui na Muran!
          </p>
        </div>

        {/* Cards de Valores */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-[rgba(235,235,240,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl hover:border-[#ff6e00]/20 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#321e32]">
                <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
                  <Target className="text-[#ff6e00]" />
                </div>
                <span className="bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                  Nossa Missão
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#321e32]/90 leading-relaxed">
                Impulsionar negócios digitais com transparência e comprometimento, construindo parcerias duradouras.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[rgba(235,235,240,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl hover:border-[#ff6e00]/20 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#321e32]">
                <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
                  <Users className="text-[#ff6e00]" />
                </div>
                <span className="bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                  Nossos Valores
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {['Agilidade', 'Colaboração', 'Comprometimento', 'Excelência', 'Flexibilidade', 'Transparência'].map((value) => (
                  <div key={value} className="flex items-center gap-2 text-[#321e32]/90">
                    <Star className="w-4 h-4 text-[#ff6e00]" />
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[rgba(235,235,240,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl hover:border-[#ff6e00]/20 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#321e32]">
                <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
                  <ArrowUpRight className="text-[#ff6e00]" />
                </div>
                <span className="bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                  Nossa Visão
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#321e32]/90 leading-relaxed">
                Ser referência em marketing digital através de serviços de excelência.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas e Aniversários */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[rgba(235,235,240,0.95)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#321e32]">
                <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
                  <TrendingUp className="text-[#ff6e00]" />
                </div>
                <span className="bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                  Métricas Chave
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/70 rounded-xl border border-[#321e32]/10">
                  <span className="text-[#321e32]/80">Clientes Ativos</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                    {clientMetrics?.activeCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/70 rounded-xl border border-[#321e32]/10">
                  <span className="text-[#321e32]/80">Novos Clientes</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#ff6e00] to-[#ff914d] bg-clip-text text-transparent">
                    {clientMetrics?.newCount || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {teamMembers && <BirthdayCard members={teamMembers} />}
        </div>

        {/* Citação do Dia */}
        <Card className="bg-gradient-to-r from-[#ff6e00] to-[#ff914d] border border-[#ff6e00]/30">
          <CardContent className="p-6">
            <p className="text-center text-white/90 italic text-lg">
              "{todaysQuote.quote}"
            </p>
            <p className="text-center mt-3 font-medium text-white/80">
              - {todaysQuote.author}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
