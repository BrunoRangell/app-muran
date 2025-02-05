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
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, email, role")
        .order("name");

      if (error) throw error;

      setTeamMembers(data || []);
      setError(null);
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

  const filteredMembers = teamMembers.filter((member) =>
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
        <h3 className="text-xl font-semibold text-gray-800">
          Erro ao carregar membros
        </h3>
        <p className="text-gray-600 max-w-md">
          Ocorreu um problema ao tentar carregar a lista de membros. Por favor,
          tente novamente mais tarde.
        </p>
        <Button onClick={fetchTeamMembers} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="h-8 w-8 text-muran-primary animate-spin" />
        <p className="text-gray-600">Carregando membros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          placeholder="Buscar por nome, email ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 focus-visible:ring-muran-primary/30 transition-all"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {filteredMembers.length === 0 ? (
          <Card className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <User className="h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm ? "Nenhum resultado encontrado" : "Lista de membros vazia"}
            </h3>
            <p className="text-gray-600 text-center text-sm max-w-xs">
              {searchTerm
                ? "Tente ajustar sua busca ou verifique a ortografia"
                : "Nenhum membro cadastrado no sistema ainda"}
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="p-4 hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-muran-primary/10 p-2 rounded-full">
                    <User className="h-6 w-6 text-muran-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    <span className="inline-block bg-muran-primary/10 text-muran-primary text-xs px-2 py-1 rounded-full">
                      {member.role}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleLogin(member)}
                  className="shrink-0 hover:bg-muran-primary/90 bg-muran-primary text-white hover:shadow-sm transition-all"
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

      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Acesso do Membro
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedMember?.name
                ? `Autenticação para ${selectedMember.name}`
                : "Complete o login abaixo"}
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
