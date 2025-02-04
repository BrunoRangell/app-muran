import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, LogIn, Loader2, AlertCircle, User } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, email, role')
        .order('name');

      if (error) throw error;

      setTeamMembers(data || []);
    } catch (err) {
      setError("Falha ao carregar membros da equipe");
      toast({
        title: "Erro de conexão",
        description: "Não foi possível carregar os dados da equipe",
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-xl font-semibold text-gray-800">Erro ao carregar membros</h3>
        <p className="text-gray-600 max-w-md">
          Ocorreu um problema ao tentar carregar a lista de membros.
        </p>
        <Button 
          onClick={fetchTeamMembers} 
          variant="outline" 
          className="mt-4 gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-gray-600">Carregando membros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Buscar membro por nome, email ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 focus-visible:ring-blue-500"
        />
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.length === 0 ? (
          <Card className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <User className="h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm ? "Nenhum resultado encontrado" : "Lista de membros vazia"}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchTerm 
                ? "Tente ajustar sua busca"
                : "Nenhum membro cadastrado no sistema"}
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className="p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Member Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-6 w-6 text-blue-800" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={() => handleLogin(member)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Acessar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Acesso do membro
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedMember?.name ? `Autenticação para ${selectedMember.name}` : 'Complete o login abaixo'}
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
