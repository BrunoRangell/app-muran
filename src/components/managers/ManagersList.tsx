import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, LogIn, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManagerLoginForm } from "./ManagerLoginForm";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { seedInitialData } from "@/lib/seed";

interface Manager {
  id: string;
  name: string;
}

export const ManagersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchManagers = async () => {
    try {
      console.log('Buscando gestores...');
      const { data, error } = await supabase
        .from('managers')
        .select('*');

      if (error) {
        console.error('Erro ao buscar gestores:', error);
        throw error;
      }

      console.log('Gestores encontrados:', data);
      setManagers(data || []);
    } catch (error) {
      console.error('Erro ao carregar gestores:', error);
      toast({
        title: "Erro ao carregar gestores",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleSeed = async () => {
    try {
      setIsLoading(true);
      await seedInitialData();
      await fetchManagers();
      toast({
        title: "Sucesso",
        description: "Dados iniciais criados com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar dados iniciais:', error);
      toast({
        title: "Erro ao criar dados iniciais",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogin = (manager: Manager) => {
    setSelectedManager(manager);
    setIsLoginDialogOpen(true);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <Input
            placeholder="Buscar gestor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleSeed}
        >
          <Plus size={16} />
          Criar Dados Iniciais
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredManagers.length === 0 ? (
          <Card className="p-4">
            <p className="text-center text-gray-500">Nenhum gestor encontrado</p>
          </Card>
        ) : (
          filteredManagers.map((manager) => (
            <Card key={manager.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{manager.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleLogin(manager)}
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
            <DialogTitle>Login - {selectedManager?.name}</DialogTitle>
          </DialogHeader>
          {selectedManager && (
            <ManagerLoginForm
              managerId={selectedManager.id}
              managerName={selectedManager.name}
              onClose={() => setIsLoginDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};