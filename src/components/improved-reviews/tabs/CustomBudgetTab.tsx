
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Search } from "lucide-react";

export function CustomBudgetTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleCreateCustomBudget = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A funcionalidade de orçamentos personalizados será implementada em breve.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Orçamentos Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreateCustomBudget} className="bg-[#ff6e00] hover:bg-[#e66300]">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </div>
          
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Nenhum orçamento personalizado encontrado</h3>
            <p className="text-sm">Crie orçamentos personalizados para períodos específicos dos seus clientes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
