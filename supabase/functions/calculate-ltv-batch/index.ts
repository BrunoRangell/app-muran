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
        // consulta como o usuário logado (sem isso roda como anônimo, o RLS esconde tudo e o LTV dá 0)
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
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

    // LTV de cada mês = mesma regra do card e do detalhe do LTV:
    // pagamentos dos 12 meses até o mês (inclusive), só de clientes ativos no período e com pagamento > 0,
    // divididos pela quantidade desses clientes. ("Outras receitas" sem cliente não entram.)
    const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const monthStr of targetMonths) {
      const [year, month] = monthStr.split('-').map(Number);
      const startDate = new Date(year, month - 12, 1); // 12 meses: 11 anteriores + o próprio
      const endDate = new Date(year, month, 0); // último dia do mês alvo
      const startStr = ymd(startDate);
      const endStr = ymd(endDate);

      const { data: payments, error: paymentsError } = await supabaseClient
        .from('payments')
        .select('client_id, amount')
        .gte('reference_month', startStr)
        .lte('reference_month', endStr)
        .not('client_id', 'is', null)
        .gt('amount', 0);

      if (paymentsError) throw paymentsError;

      const byClient: Record<string, number> = {};
      for (const p of payments ?? []) byClient[p.client_id] = (byClient[p.client_id] || 0) + Number(p.amount);

      let total = 0;
      let count = 0;
      for (const client of clients ?? []) {
        if (!client.first_payment_date) continue;
        const first = String(client.first_payment_date).slice(0, 10);
        const last = client.last_payment_date ? String(client.last_payment_date).slice(0, 10) : '9999-12-31';
        if (first > endStr || last < startStr) continue;
        const paid = byClient[client.id] || 0;
        if (paid > 0) {
          total += paid;
          count++;
        }
      }

      results[monthStr] = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
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
