import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ManagerLoginForm } from "./ManagerLoginForm";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ManagersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      console.log('Buscando membros da equipe...');
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email, role');

      if (error) {
        console.error('Erro ao buscar membros:', error);
        throw error;
      }

      console.log('Membros encontrados:', data);
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast({
        title: "Erro ao carregar membros",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogin = (member: TeamMember) => {
    setSelectedMember(member);
    setIsLoginDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Carregando membros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <Input
          placeholder="Buscar membro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredMembers.length === 0 ? (
          <Card className="p-4">
            <p className="text-center text-gray-500">Nenhum membro encontrado</p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleLogin(member)}
                >
                  <LogIn size={16} />
                  Login
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login - {selectedMember?.name}</DialogTitle>
            <DialogDescription>
              Digite sua senha para acessar o sistema
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <ManagerLoginForm
              managerId={selectedMember.id}
              managerName={selectedMember.name}
              onClose={() => setIsLoginDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};