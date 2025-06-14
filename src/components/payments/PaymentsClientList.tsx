
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Client } from "@/types/client";

interface PaymentsClientListProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onNewPayment: (client: Client) => void;
  onViewHistory: (client: Client) => void;
}

export const PaymentsClientList = ({ 
  clients, 
  onSelectClient, 
  onNewPayment, 
  onViewHistory 
}: PaymentsClientListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredClients.map(client => (
            <div 
              key={client.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => onSelectClient(client)}
            >
              <div className="flex-1">
                <div className="font-medium">{client.company_name}</div>
                <div className="text-sm text-muted-foreground">{client.contact_name}</div>
                <div className="text-sm font-medium mt-1">
                  {formatCurrency(client.contract_value)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewPayment(client);
                    }}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(client);
                    }}
                    className="h-8 w-8"
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
