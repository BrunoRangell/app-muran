
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Simulação: estrutura de dados de saúde de campanhas
type Platform = "Meta Ads" | "Google Ads";
export type CampaignStatus = "ok" | "warning" | "error" | "nodata";

export interface CampaignHealth {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  platforms: Array<{
    name: Platform;
    costToday: number;
    impressionsToday?: number;
    errors: string[];
    status: CampaignStatus;
  }>;
}

function mockFetchHealthData(): Promise<CampaignHealth[]> {
  // Aqui seria feita chamada à API/backend real. Use dados simulados.
  return new Promise(resolve =>
    setTimeout(() => resolve([
      {
        clientId: "1",
        clientName: "Padaria Real",
        companyEmail: "padaria@teste.com",
        platforms: [
          {
            name: "Meta Ads",
            costToday: 35.2,
            impressionsToday: 4500,
            errors: [],
            status: "ok"
          },
          {
            name: "Google Ads",
            costToday: 0,
            impressionsToday: 0,
            errors: ["Não rodou hoje", "Orçamento atingido"],
            status: "error"
          }
        ]
      },
      {
        clientId: "2",
        clientName: "Dental Prime",
        companyEmail: "dental@teste.com",
        platforms: [
          {
            name: "Meta Ads",
            costToday: 0,
            impressionsToday: 0,
            errors: ["Nenhum gasto hoje"],
            status: "warning"
          },
          {
            name: "Google Ads",
            costToday: 12,
            impressionsToday: 1500,
            errors: [],
            status: "ok"
          }
        ]
      }
    ]), 900)
  );
}

export function useCampaignHealthData() {
  const [filterValue, setFilterValue] = useState("");

  // Para produção: substituir por fetch real (com tratamento de erros)
  const { data, isLoading, error } = useQuery({
    queryKey: ["health-today"],
    queryFn: mockFetchHealthData,
    staleTime: 5 * 60 * 1000 // cache curto
  });

  function handleAction(action: "details" | "review", clientId: string, platform: Platform) {
    if (action === "details") {
      window.open(`/clientes/${clientId}?platform=${encodeURIComponent(platform)}`, "_blank");
    }
    if (action === "review") {
      window.open(`/revisao-diaria-avancada?clienteId=${clientId}&platform=${encodeURIComponent(platform)}`, "_blank");
    }
  }

  return {
    data,
    isLoading,
    error: error ? "Falha ao obter dados." : null,
    filterValue,
    setFilterValue,
    handleAction
  };
}
