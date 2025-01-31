import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Briefcase, CalendarClock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  birthday?: string;
  start_date?: string;
}

const Managers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        console.log('Buscando membros da equipe...');
        const { data, error } = await supabase
          .from('team_members')
          .select('id, name, role, photo_url, birthday, start_date')
          .order('name');

        if (error) {
          console.error('Erro ao buscar membros:', error);
          throw error;
        }

        console.log('Membros encontrados:', data);
        setTeamMembers(data || []);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-muran-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Equipe</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.photo_url} alt={member.name} />
                <AvatarFallback className="bg-muran-primary text-white">
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-muran-dark">{member.name}</h3>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{member.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Aniversário: {member.birthday ? format(new Date(member.birthday), 'dd/MM') : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-4 w-4" />
                <span>Na Muran desde: {member.start_date ? format(new Date(member.start_date), 'MM/yyyy') : 'N/A'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Managers;