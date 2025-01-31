import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-muran-dark">Equipe</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Lista de Integrantes</h2>
        {isLoading ? (
          <p className="text-gray-600">Carregando integrantes...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Foto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers?.map((member: TeamMember) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{new Date(member.start_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <img src={member.photo_url} alt={member.name} className="h-10 w-10 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Managers;
