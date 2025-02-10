
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { addMonths, startOfMonth, endOfMonth, parseISO, isValid, isWithinInterval, format, subMonths } from "date-fns";
import { Client } from "../types";

export const useMetricsData = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["filteredClientsMetrics", dateRange],
    queryFn: async () => {
      console.log("Fetching filtered clients for period:", dateRange);
      const { data: clients, error } = await supabase
        .from("clients")
        .select("*");

      if (error) {
        console.error("Error fetching filtered clients:", error);
        throw error;
      }

      // Gera dados mensais para o período selecionado
      const months = [];
      let currentDate = new Date(dateRange.start);
      
      while (currentDate <= dateRange.end) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const threeMonthsBeforeStart = startOfMonth(subMonths(monthStart, 3));

        // Calcula clientes adquiridos no mês
        const newClients = clients.filter((client: Client) => {
          try {
            if (!client.first_payment_date) return false;
            const firstPayment = new Date(client.first_payment_date);
            firstPayment.setDate(firstPayment.getDate() + 1);
            return isValid(firstPayment) && 
                   isWithinInterval(firstPayment, { start: monthStart, end: monthEnd });
          } catch (error) {
            console.error("Error processing new client:", client, error);
            return false;
          }
        }).length;

        // Filtra clientes ativos no mês atual
        const activeClientsInMonth = clients.filter((client: Client) => {
          try {
            if (!client.first_payment_date) return false;
            const clientStart = new Date(client.first_payment_date);
            clientStart.setDate(clientStart.getDate() + 1);
            
            const clientEnd = client.last_payment_date ? 
              (() => {
                const date = new Date(client.last_payment_date);
                date.setDate(date.getDate() + 1);
                return date;
              })() : 
              new Date();
            
            if (!isValid(clientStart)) return false;
            if (client.last_payment_date && !isValid(clientEnd)) return false;

            return isWithinInterval(monthStart, { start: clientStart, end: clientEnd }) ||
                   isWithinInterval(monthEnd, { start: clientStart, end: clientEnd }) ||
                   (clientStart <= monthStart && clientEnd >= monthEnd);
          } catch (error) {
            console.error("Error processing active client:", client, error);
            return false;
          }
        });

        // Calcula churned clients para o mês específico
        const churned = clients.filter(client => {
          if (!client.last_payment_date) return false;
          try {
            const lastPaymentDate = new Date(client.last_payment_date);
            lastPaymentDate.setDate(lastPaymentDate.getDate() + 1);
            return isValid(lastPaymentDate) && 
                   isWithinInterval(lastPaymentDate, { start: monthStart, end: monthEnd });
          } catch (error) {
            console.error("Error processing churn date for client:", client, error);
            return false;
          }
        }).length;

        // Calcula clientes ativos no início do mês
        const activeClientsAtStartOfMonth = clients.filter((client: Client) => {
          if (!client.first_payment_date) return false;
          const clientStart = new Date(client.first_payment_date);
          clientStart.setDate(clientStart.getDate() + 1);
          
          return clientStart <= monthStart && 
                 (!client.last_payment_date || new Date(client.last_payment_date) > monthStart);
        }).length;

        try {
          const monthData = {
            month: format(currentDate, 'MMM/yy'),
            mrr: activeClientsInMonth.reduce((sum, client) => sum + (client.contract_value || 0), 0),
            clients: activeClientsInMonth.length,
            churn: churned,
            churnRate: activeClientsAtStartOfMonth > 0 
              ? (churned / activeClientsAtStartOfMonth) * 100 
              : 0,
            newClients: newClients
          };
          months.push(monthData);
        } catch (error) {
          console.error("Error creating month data for:", currentDate, error);
        }

        currentDate = addMonths(currentDate, 1);
      }

      console.log("Generated monthly data:", months);
      return months;
    },
  });
};

