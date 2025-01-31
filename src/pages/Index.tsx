import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
          Impulsionando negócios no mundo digital
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

      <div className="mt-8">
        <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10">
          <CardContent className="p-6">
            <p className="text-center text-lg text-gray-700 font-medium italic">
              "Construímos juntos o caminho para o seu sucesso no digital."
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nossa Essência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Inovação</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Estratégia</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Confiança</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Competência</span>
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Parceria</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Agilidade</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Prosperidade</span>
                <span className="inline-block px-3 py-1 rounded-full bg-muran-secondary text-muran-complementary">Excelência</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nosso Compromisso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Com Resultados:</h4>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Estratégias personalizadas</li>
                  <li>Métricas transparentes</li>
                  <li>Crescimento sustentável</li>
                  <li>Inovação constante</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Com Pessoas:</h4>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Parceria duradoura</li>
                  <li>Comunicação clara</li>
                  <li>Suporte dedicado</li>
                  <li>Evolução conjunta</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;