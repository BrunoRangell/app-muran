
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ClientMetaAccountSettingsProps {
  clientId?: string;
  clientName?: string;
  metaAccountId?: string;
}

export const ClientMetaAccountSettings = ({ 
  clientId, 
  clientName,
  metaAccountId 
}: ClientMetaAccountSettingsProps) => {
  const [accountId, setAccountId] = useState<string>(metaAccountId || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!clientId) return;
    
    // Validar o ID da conta Meta
    if (!accountId.trim()) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um ID de conta Meta válido.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Atualizar o ID da conta Meta do cliente
      const { error } = await supabase
        .from("clients")
        .update({ meta_account_id: accountId })
        .eq("id", clientId);
        
      if (error) throw error;
      
      toast({
        title: "Conta Meta atualizada",
        description: `O ID da conta Meta de ${clientName} foi atualizado com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao atualizar conta Meta:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o ID da conta Meta.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Configurações da Conta Meta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID da Conta Meta</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="ID da conta Meta (ex: act_123456789)"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#ff6e00] hover:bg-[#e66300]"
              >
                {isSaving ? "Salvando..." : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              O ID da conta Meta é necessário para a análise automática do orçamento.
              Você pode encontrar esse ID no Business Manager da Meta (act_XXXXXXXXX).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
