import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LTVCalculationRequest {
  targetMonths: string[]; // Array de meses no formato YYYY-MM
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { targetMonths } = await req.json() as LTVCalculationRequest;

    if (!targetMonths || !Array.isArray(targetMonths)) {
      throw new Error('targetMonths deve ser um array de strings no formato YYYY-MM');
    }

    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabaseClient
      .from('clients')
      .select('id, first_payment_date, last_payment_date, status');

    if (clientsError) throw clientsError;

    const results: Record<string, number> = {};

    // Calcular LTV para cada mês solicitado
    for (const monthStr of targetMonths) {
      const [year, month] = monthStr.split('-').map(Number);
      const targetDate = new Date(year, month - 1, 1);
      
      // Data de início: 12 meses antes
      const startDate = new Date(targetDate);
      startDate.setMonth(startDate.getMonth() - 12);
      
      // Data de fim: último dia do mês alvo
      const endDate = new Date(year, month, 0);

      // Buscar pagamentos do período
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('payments')
        .select('client_id, amount')
        .gte('reference_month', startDate.toISOString().split('T')[0])
        .lte('reference_month', endDate.toISOString().split('T')[0])
        .gt('amount', 0);

      if (paymentsError) throw paymentsError;

      // Filtrar clientes ativos no período
      const activeClients = clients?.filter(client => {
        const firstPayment = client.first_payment_date ? new Date(client.first_payment_date) : null;
        const lastPayment = client.last_payment_date ? new Date(client.last_payment_date) : null;

        if (!firstPayment) return false;

        const isActiveInPeriod = firstPayment <= endDate &&
          (client.status === 'active' || (lastPayment && lastPayment >= startDate));

        return isActiveInPeriod;
      }) || [];

      // Calcular receita total do período
      const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Calcular LTV
      const ltv = activeClients.length > 0 ? totalRevenue / activeClients.length : 0;
      results[monthStr] = Math.round(ltv * 100) / 100;
    }

    return new Response(
      JSON.stringify({ success: true, ltvValues: results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
