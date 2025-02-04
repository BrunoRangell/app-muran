import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap, TrendingUp } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-muran-complementary">
          {greeting}, {userName ? userName : "Bem-vindo"}! <Zap className="inline-block ml-2 text-muran-primary" />
        </h1>
        <p className="text-lg text-gray-600">
          É ótimo ter você aqui na Muran!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-muran-primary" />
              Nossa Missão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Contribuir para o impulsionamento de negócios no mundo digital, assessorando empreendedores com transparência, leveza e comprometimento e construindo parcerias duradouras.
            </p>
          </CardContent>
        </Card>

        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-muran-primary" />
              Nossos Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Agilidade</li>
              <li>Colaboração</li>
              <li>Comprometimento</li>
              <li>Excelência</li>
              <li>Flexibilidade</li>
              <li>Transparência</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="text-muran-primary" />
              Nossa Visão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Prestar serviços de excelência em marketing digital, contribuindo para a prosperidade de clientes e almejando tornar-se referência no nicho.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-muran-primary" />
              Métricas de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Clientes Ativos</span>
                <span className="text-muran-primary font-bold text-xl">
                  {clientMetrics?.activeCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span Clientes este Mês</span>
                <span className="text-muran-primary font-bold text-xl">
                  {clientMetrics?.newCount || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {teamMembers && <BirthdayCard members={teamMembers} />}
      </div>

      <div className="mt-8">
        <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10">
          <CardContent className="p-6">
            <p className="text-center text-lg text-gray-700 font-medium italic">
              "{todaysQuote.quote}" - {todaysQuote.author}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;