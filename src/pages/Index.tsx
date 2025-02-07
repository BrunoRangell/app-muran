
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { WelcomeHeader } from "@/components/index/WelcomeHeader";
import { CompanyCards } from "@/components/index/CompanyCards";
import { MetricsCard } from "@/components/index/MetricsCard";
import { QuoteCard } from "@/components/index/QuoteCard";
import { BirthdayCard } from "@/components/team/BirthdayCard";
import { GoalCard } from "@/components/index/GoalCard";

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

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
            .select("name, permission, role, avatar_url")
            .eq("email", session.user.email)
            .single();

          if (teamMember) {
            setUserName(teamMember.name.split(" ")[0]);
            setUserRole(teamMember.role || "");
            setAvatarUrl(teamMember.avatar_url || "");
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
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header Section with Profile */}
      <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt={userName}
              className="object-cover"
            />
          </Avatar>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-muran-complementary">
              {greeting}, {userName}! <span className="text-muran-primary">✨</span>
            </h1>
            {userRole && (
              <p className="text-gray-600">{userRole}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6">
        {/* Culture Carousel and Goal Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CompanyCards />
          </div>
          <div>
            <GoalCard isAdmin={isAdmin} />
          </div>
        </div>

        {/* Metrics and Birthdays */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricsCard clientMetrics={clientMetrics} />
          {teamMembers && <BirthdayCard members={teamMembers} />}
        </div>

        {/* Inspirational Quote */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm">
          <QuoteCard quote={todaysQuote} />
        </div>
      </div>
    </div>
  );
};

export default Index;
