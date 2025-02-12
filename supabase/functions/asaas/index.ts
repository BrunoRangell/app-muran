
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  status: string;
  paymentDate: string;
  customerName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não encontrada')
    }

    // Define o período para buscar os pagamentos (30 dias atrás até hoje)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const response = await fetch(
      `https://api.asaas.com/v3/payments?startDate=${thirtyDaysAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`,
      {
        headers: {
          'access_token': asaasApiKey,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erro na API do Asaas: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Dados recebidos do Asaas:', data)

    // Mapear os pagamentos do Asaas para o formato da nossa aplicação
    const payments = data.data.map((payment: any) => ({
      id: payment.id,
      customer: payment.customer,
      value: payment.value,
      netValue: payment.netValue,
      status: payment.status,
      paymentDate: payment.paymentDate,
      customerName: payment.customerName,
    }))

    return new Response(
      JSON.stringify({ payments }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
