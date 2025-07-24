
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ClientBudgetSettingsProps {
  clientId?: string;
  clientName?: string;
  currentBudget?: number;
}

export const ClientBudgetSettings = ({ 
  clientId, 
  clientName,
  currentBudget 
}: ClientBudgetSettingsProps) => {
  const [budget, setBudget] = useState<string>(currentBudget?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!clientId) return;
    
    // Validar o orçamento
    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o orçamento.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Atualizar o orçamento do cliente
      const { error } = await supabase
        .from("clients")
        .update({ meta_ads_budget: budgetValue })
        .eq("id", clientId);
        
      if (error) throw error;
      
      toast({
        title: "Orçamento atualizado",
        description: `O orçamento de ${clientName} foi atualizado com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Configurações de Orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Orçamento Mensal (R$)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor do orçamento"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
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
          
          <div className="bg-amber-50 p-4 rounded border border-amber-200">
            <p className="text-sm text-amber-800">
              Este valor de orçamento será usado como base para calcular o orçamento diário recomendado.
              Para orçamentos temporários ou específicos, use a funcionalidade de Orçamentos Personalizados.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
