import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BirthdayWidget } from "@/components/home/BirthdayWidget";
import { DailyQuote } from "@/components/home/DailyQuote";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

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

        <Card className="transform transition-all hover:scale-105 md:col-span-2 lg:col-span-1">
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
        <BirthdayWidget />
        <DailyQuote />
      </div>
    </div>
  );
};

export default Index;
