import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap, TrendingUp, CheckCircle } from "lucide-react";
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
    <div className="space-y-8 p-4 md:p-6">
      {/* Header Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10 p-6 rounded-2xl shadow-sm">
        <h1 className="text-4xl md:text-5xl font-bold text-muran-complementary">
          {greeting}, {userName ? userName : "Bem-vindo"}! 
          <Zap className="inline-block ml-2 text-muran-primary animate-pulse" />
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          É ótimo ter você aqui na Muran! Aqui está um resumo das atividades e métricas importantes.
        </p>
      </div>

      {/* Value Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-muran-primary/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-muran-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <Target className="text-muran-primary w-6 h-6" />
              </div>
              Nossa Missão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Contribuir para o impulsionamento de negócios no mundo digital, assessorando empreendedores com transparência, leveza e comprometimento e construindo parcerias duradouras.
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-muran-primary/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-muran-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <Users className="text-muran-primary w-6 h-6" />
              </div>
              Nossos Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {['Agilidade', 'Colaboração', 'Comprometimento', 'Excelência', 'Flexibilidade', 'Transparência'].map((value) => (
                <li key={value} className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-muran-primary" />
                  {value}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-muran-primary/5 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-muran-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <ArrowUpRight className="text-muran-primary w-6 h-6" />
              </div>
              Nossa Visão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Prestar serviços de excelência em marketing digital, contribuindo para a prosperidade de clientes e almejando tornar-se referência no nicho.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Birthdays Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-t-4 border-muran-primary hover:shadow-xl transition-transform duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <TrendingUp className="text-muran-primary w-6 h-6" />
              </div>
              Métricas de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col p-4 bg-muran-primary/5 rounded-xl border border-muran-primary/10">
                <span className="text-sm text-gray-500">Clientes ativos</span>
                <span className="text-3xl font-bold text-muran-primary mt-1">
                  {clientMetrics?.activeCount || 0}
                </span>
              </div>
              <div className="flex flex-col p-4 bg-muran-primary/5 rounded-xl border border-muran-primary/10">
                <span className="text-sm text-gray-500">Novos clientes este mês</span>
                <span className="text-3xl font-bold text-muran-primary mt-1">
                  {clientMetrics?.newCount || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {teamMembers && <BirthdayCard members={teamMembers} />}
      </div>

      {/* Quote Section */}
      <div className="mt-8">
        <Card className="bg-gradient-to-r from-muran-primary to-muran-complementary shadow-xl">
          <CardContent className="p-6">
            <p className="text-center text-lg text-white font-medium italic leading-relaxed">
              "{todaysQuote.quote}"
            </p>
            <p className="text-center text-muran-primary/90 font-semibold mt-4">
              - {todaysQuote.author}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
