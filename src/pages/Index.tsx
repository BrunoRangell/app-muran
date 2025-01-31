import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Heart, Sun } from "lucide-react";
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
            setUserName(teamMember.name.split(' ')[0]); // Get first name only
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
          {greeting}, {userName ? userName : "Bem-vindo"}! <Smile className="inline-block ml-2 text-muran-primary" />
        </h1>
        <p className="text-lg text-gray-600">
          É ótimo ter você aqui na Muran!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="text-muran-primary" />
              Nosso Propósito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Transformar a gestão financeira em uma experiência simples e eficiente para nossos clientes.
            </p>
          </CardContent>
        </Card>

        <Card className="transform transition-all hover:scale-105">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="text-muran-primary" />
              Nossos Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Transparência em primeiro lugar</li>
              <li>Compromisso com resultados</li>
              <li>Inovação constante</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="transform transition-all hover:scale-105 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="text-muran-primary" />
              Dica do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Explore a seção "Meu Financeiro" para acompanhar suas informações e manter-se atualizado com seus dados financeiros.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10">
          <CardContent className="p-6">
            <p className="text-center text-lg text-gray-700">
              "A excelência não é um ato, mas um hábito." - Aristóteles
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;