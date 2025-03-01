
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

interface CampaignsTableProps {
  campaigns: SimpleMetaCampaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center">
        <p className="text-sm text-gray-500">Nenhuma campanha encontrada.</p>
      </div>
    );
  }

  // Registrar valores brutos para depuração
  console.log("[CampaignsTable] Valores brutos de campanhas:", 
    campaigns.map(c => ({
      name: c.name,
      id: c.id,
      spendRaw: c.spend,
      spendType: typeof c.spend
    }))
  );

  // Garantir que cada campanha tenha um valor de gasto válido
  const normalizedCampaigns = campaigns.map(campaign => {
    // Certifique-se de que campaign.spend seja um número válido
    let spendValue: number;
    
    // Tratar diferentes formatos de spend
    if (typeof campaign.spend === 'number') {
      // Caso seja um número simples
      spendValue = campaign.spend;
    } else if (typeof campaign.spend === 'string') {
      // Caso seja uma string, converter para número
      spendValue = parseFloat(campaign.spend);
    } else if (typeof campaign.spend === 'object' && campaign.spend !== null) {
      // Caso seja um objeto (formato comum da API do Meta), extrair valor
      const spendObj = campaign.spend as any;
      
      if (spendObj.value !== undefined) {
        spendValue = parseFloat(String(spendObj.value));
      } else if (spendObj.amount !== undefined) {
        spendValue = parseFloat(String(spendObj.amount));
      } else {
        // Tentar outras propriedades comuns do objeto spend
        const possibleValues = [
          spendObj.spend, 
          spendObj.cost, 
          spendObj.total_spend,
          spendObj.total_amount
        ];
        
        // Usar o primeiro valor não-nulo encontrado
        const foundValue = possibleValues.find(v => v !== undefined && v !== null);
        spendValue = foundValue ? parseFloat(String(foundValue)) : 0;
      }
    } else if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
      // Tentar buscar dados de gasto dos insights
      const insightSpend = campaign.insights.data[0].spend;
      spendValue = insightSpend !== undefined ? parseFloat(String(insightSpend)) : 0;
    } else {
      // Sem dados de gasto, usar zero
      spendValue = 0;
    }
    
    // Verificar se o valor obtido é válido
    spendValue = isNaN(spendValue) ? 0 : spendValue;
    
    console.log(`[CampaignsTable] Processando campanha ${campaign.name} (${campaign.id}): 
      Gasto original: ${JSON.stringify(campaign.spend)}, 
      Tipo: ${typeof campaign.spend}, 
      Gasto normalizado: ${spendValue}`);
    
    return {
      ...campaign,
      spend: spendValue
    };
  });

  // Calcular o total gasto com segurança
  const totalSpent = normalizedCampaigns.reduce((sum, campaign) => {
    return sum + campaign.spend;
  }, 0);

  // Registrar valores para depuração
  console.log("[CampaignsTable] Campanhas normalizadas:", 
    normalizedCampaigns.map(c => ({
      name: c.name,
      id: c.id,
      spend: c.spend
    }))
  );
  console.log("[CampaignsTable] Total gasto calculado:", totalSpent);

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          Total gasto em campanhas: {formatCurrency(totalSpent)}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {normalizedCampaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  let bgColor = "bg-gray-100 text-gray-800";
  let statusText = status;
  
  if (status === "ACTIVE") {
    bgColor = "bg-green-100 text-green-800";
    statusText = "Ativa";
  } else if (status === "PAUSED") {
    bgColor = "bg-yellow-100 text-yellow-800";
    statusText = "Pausada";
  } else if (status === "ARCHIVED" || status === "DELETED") {
    bgColor = "bg-red-100 text-red-800";
    statusText = status === "ARCHIVED" ? "Arquivada" : "Excluída";
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {statusText}
    </span>
  );
}
