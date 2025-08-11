import { Client } from "@/components/clients/types";
import { calculateLTVForChart } from "./unifiedLTVCalculations";

// Função atualizada para usar o cálculo unificado de LTV
export const calculateMovingLTV12Months = async (clients: Client[], targetMonth: Date) => {
  return await calculateLTVForChart(clients, targetMonth);
};