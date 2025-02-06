import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth } from "date-fns";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { WelcomeHeader } from "@/components/index/WelcomeHeader";
import { CompanyCards } from "@/components/index/CompanyCards";
import { MetricsCard } from "@/components/index/MetricsCard";
import { QuoteCard } from "@/components/index/QuoteCard";
import { BirthdayCard } from "@/components/team/BirthdayCard";
import { GoalCard } from "@/components/index/GoalCard";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: teamMembers } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: clientMetrics } = useQuery({
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data: teamMember } = await supabase
            .from("team_members")
            .select("name, permission")
            .eq("email", session.user.email)
            .single();

          if (teamMember?.name) {
            setUserName(teamMember.name.split(" ")[0]);
          }
          setIsAdmin(teamMember?.permission === "admin");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    setGreeting(getGreeting());
    fetchUserData();
  }, []);

  const todaysQuote = getRandomQuote();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-4 md:gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <WelcomeHeader greeting={greeting} userName={userName} />
          </div>
          <div>
            <GoalCard isAdmin={isAdmin} />
          </div>
        </div>
        <CompanyCards />
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <MetricsCard clientMetrics={clientMetrics} />
          {teamMembers && <BirthdayCard members={teamMembers} />}
        </div>
        <QuoteCard quote={todaysQuote} />
      </div>
    </div>
  );
};

export default Index;