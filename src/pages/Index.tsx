import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Target, Users, Zap, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { BirthdayCard } from "@/components/team/BirthdayCard";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  // Consultas otimizadas
  const { data: teamMembers, isLoading: loadingTeam } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: clientMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["client_metrics"],
    queryFn: fetchClientMetrics
  });

  // Efeito de partículas no header
  const ParticleBackground = () => (
    <div className="absolute inset-0 -z-10 opacity-20">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-muran-primary rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8 p-6 relative overflow-hidden">
      {/* Header com gradiente e partículas */}
      <div className="text-center space-y-4 relative pb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-muran-primary/20 to-muran-complementary/20 blur-3xl opacity-30 -z-20" />
        <ParticleBackground />
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-muran-primary to-muran-complementary bg-clip-text text-transparent animate-fade-in">
          {greeting}, {userName || "Bem-vindo"}!
          <Sparkles className="inline-block ml-2 text-muran-primary animate-sparkle" />
        </h1>
        
        <p className="text-lg text-muted-foreground font-medium">
          É ótimo ter você aqui na Muran!
        </p>
      </div>

      {/* Grid principal com animações */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-card-entrance">
        <MissionCard />
        <ValuesCard />
        <VisionCard />
      </div>

      {/* Seção inferior */}
      <div className="grid gap-6 md:grid-cols-2">
        <MetricsCard loading={loadingMetrics} metrics={clientMetrics} />
        {loadingTeam ? <BirthdaySkeleton /> : <BirthdayCard members={teamMembers} />}
      </div>

      <QuoteCard quote={getRandomQuote()} />
    </div>
  );
};

// Componentes estilizados
const MissionCard = () => (
  <Card className="relative group hover:shadow-xl transition-all duration-300 border border-muran-primary/20 hover:border-muran-primary/40">
    <div className="absolute inset-0 bg-gradient-to-br from-muran-primary/5 to-transparent rounded-lg" />
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-muran-primary">
        <Target className="w-6 h-6" />
        Nossa Missão
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground leading-relaxed">
        Contribuir para o impulsionamento de negócios no mundo digital, assessorando empreendedores com transparência, leveza e comprometimento.
      </p>
    </CardContent>
  </Card>
);

const ValuesCard = () => (
  <Card className="hover:shadow-xl transition-all duration-300 border border-muran-complementary/20 hover:border-muran-complementary/40">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-muran-complementary">
        <Users className="w-6 h-6" />
        Nossos Valores
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="grid grid-cols-2 gap-3 text-muted-foreground">
        {['Agilidade', 'Colaboração', 'Comprometimento', 'Excelência', 'Flexibilidade', 'Transparência'].map((value) => (
          <li key={value} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-muran-primary rounded-full" />
            {value}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const VisionCard = () => (
  <Card className="hover:shadow-xl transition-all duration-300 border border-muran-primary/20 hover:border-muran-primary/40">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-muran-primary">
        <ArrowUpRight className="w-6 h-6" />
        Nossa Visão
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground leading-relaxed">
        Tornar-se referência em serviços de marketing digital, impulsionando a prosperidade de nossos clientes através de soluções inovadoras.
      </p>
    </CardContent>
  </Card>
);

const MetricsCard = ({ loading, metrics }) => (
  <Card className="shadow-lg border-t-4 border-muran-primary hover:shadow-xl transition-transform duration-300 group">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="text-muran-primary" />
        Métricas de Sucesso
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : (
          <>
            <MetricItem label="Clientes ativos" value={metrics?.activeCount} />
            <MetricItem label="Novos este mês" value={metrics?.newCount} />
          </>
        )}
      </div>
    </CardContent>
  </Card>
);

const MetricItem = ({ label, value }) => (
  <div className="flex justify-between items-center p-4 bg-muran-primary/5 rounded-lg hover:bg-muran-primary/10 transition-colors">
    <span className="font-medium text-muted-foreground">{label}</span>
    <span className="text-2xl font-bold bg-gradient-to-r from-muran-primary to-muran-complementary bg-clip-text text-transparent">
      {value}
    </span>
  </div>
);

const QuoteCard = ({ quote }) => (
  <Card className="bg-gradient-to-r from-muran-primary/10 to-muran-complementary/10 border-0 shadow-md">
    <CardContent className="p-6 relative">
      <div className="absolute top-4 left-4 text-6xl text-muran-primary/20">“</div>
      <p className="text-center text-lg text-muted-foreground font-medium italic relative z-10">
        {quote.quote}
      </p>
      <div className="absolute bottom-4 right-4 text-6xl text-muran-complementary/20">”</div>
      <p className="text-center mt-4 text-muran-complementary font-medium">
        - {quote.author}
      </p>
    </CardContent>
  </Card>
);

const BirthdaySkeleton = () => (
  <Card className="h-[300px]">
    <CardContent className="p-6 flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </CardContent>
  </Card>
);

// Funções auxiliares
async function fetchClientMetrics() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: activeClients } = await supabase
    .from('clients')
    .select('count')
    .eq('status', 'active')
    .single();

  const { data: newClients } = await supabase
    .from('clients')
    .select('count')
    .eq('status', 'active')
    .gte('first_payment_date', monthStart.toISOString())
    .lte('first_payment_date', monthEnd.toISOString())
    .single();

  return {
    activeCount: activeClients?.count || 0,
    newCount: newClients?.count || 0
  };
}

// Estilos globais
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes sparkle {
    0% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(0); }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-fade-in {
    animation: fade-in 1s ease-out;
  }

  .animate-sparkle {
    animation: sparkle 1.5s infinite;
  }

  .animate-card-entrance > * {
    animation: fade-in 0.5s ease-out forwards;
  }
`;

export default Index;

<style jsx global>{globalStyles}</style>
