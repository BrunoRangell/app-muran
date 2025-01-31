import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManagerLoginForm } from "./ManagerLoginForm";

interface Manager {
  id: number;
  name: string;
}

const managers: Manager[] = [
  { id: 1, name: "Pedro Henrique" },
];

export const ManagersList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogin = (manager: Manager) => {
    setSelectedManager(manager);
    setIsLoginDialogOpen(true);
  };

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
      </div>

      <div className="grid gap-4">
        {filteredManagers.map((manager) => (
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
        ))}
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