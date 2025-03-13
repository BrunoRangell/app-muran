
import { Button } from "@/components/ui/button";
import { ExternalLink, DollarSign, BadgeDollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface ClientInfoProps {
  client: {
    company_name: string;
    meta_account_id: string | null;
    meta_ads_budget?: number;
    id: string;
  } | null;
}

export function ClientInfo({ client }: ClientInfoProps) {
  const [customBudget, setCustomBudget] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomBudget = async () => {
      if (!client?.id) return;
      
      try {
        setIsLoading(true);
        // Buscar orçamento personalizado ativo para a data atual
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from("meta_custom_budgets")
          .select("*")
          .eq("client_id", client.id)
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today)
          .order("created_at", { ascending: false })
          .maybeSingle();
          
        if (error) {
          console.error("Erro ao buscar orçamento personalizado:", error);
          return;
        }
        
        if (data) {
          console.log("Orçamento personalizado encontrado:", data);
        } else {
          console.log("Nenhum orçamento personalizado ativo encontrado para o cliente.");
        }
        
        setCustomBudget(data);
      } catch (error) {
        console.error("Erro ao buscar orçamento personalizado:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomBudget();
  }, [client?.id]);

  if (!client) return null;

  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${customBudget ? "border-l-4 border-l-[#ff6e00]" : ""}`}>
      <div className="font-semibold text-lg flex items-center gap-1">
        {client.company_name}
        {customBudget && (
          <BadgeDollarSign size={16} className="text-[#ff6e00]" />
        )}
      </div>
      
      <div className="flex flex-col space-y-2 mt-2">
        <div className="text-sm text-gray-600 flex items-center">
          ID Meta Ads: 
          <code className="mx-1 bg-gray-100 px-1 rounded">{client.meta_account_id || "Não configurado"}</code>
          {client.meta_account_id && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => window.open(`https://business.facebook.com/adsmanager/manage/campaigns?act=${client.meta_account_id}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver no Meta Ads
            </Button>
          )}
        </div>

        <div className="text-sm flex items-center font-medium">
          <DollarSign className="h-4 w-4 text-[#ff6e00] mr-1" />
          Orçamento Mensal: 
          <span className="mx-1 px-2 py-0.5 bg-[#ff6e00]/10 text-[#ff6e00] rounded">
            {customBudget 
              ? formatCurrency(customBudget.budget_amount) 
              : (client.meta_ads_budget ? formatCurrency(client.meta_ads_budget) : "Não configurado")}
          </span>
          {customBudget && (
            <Badge className="ml-1 bg-[#ff6e00]/10 border-0 text-[#ff6e00]">
              Personalizado
            </Badge>
          )}
        </div>
        
        {customBudget && (
          <div className="mt-2">
            <div className="text-xs text-gray-600 mb-1">
              Orçamento personalizado ativo no período: {new Date(customBudget.start_date).toLocaleDateString()} até {new Date(customBudget.end_date).toLocaleDateString()}
            </div>
            <Link to="/revisao-nova?tab=custom-budgets">
              <Button 
                size="sm" 
                variant="outline"
                className="mt-1 border-[#ff6e00] text-[#ff6e00] hover:bg-[#ff6e00]/10"
              >
                <BadgeDollarSign className="h-3.5 w-3.5 mr-1" />
                Gerenciar orçamentos personalizados
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
