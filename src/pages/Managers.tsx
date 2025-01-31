import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string;
  birthday: string;
  start_date: string;
}

const Managers = () => {
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      console.log("Fetching team members...");
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('id, name, role, photo_url, birthday, start_date')
          .order('start_date', { ascending: true })
          .order('name');

        if (error) {
          console.error("Error fetching team members:", error);
          throw error;
        }

        console.log("Team members fetched successfully:", data);
        return data;
      } catch (error) {
        console.error("Error in team members query:", error);
        throw error;
      }
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Equipe</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Lista de Integrantes</h2>
        {isLoading ? (
          <p className="text-gray-600">Carregando integrantes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers?.map((member: TeamMember) => (
              <Card key={member.id} className="p-6 flex flex-col items-center space-y-4 hover:shadow-lg transition-shadow">
                <Avatar className="h-24 w-24">
                  {member.photo_url ? (
                    <AvatarImage src={member.photo_url} alt={member.name} />
                  ) : (
                    <AvatarFallback className="bg-muran-primary text-white text-xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                  <p className="text-sm text-gray-500">
                    Início: {new Date(member.start_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Managers;