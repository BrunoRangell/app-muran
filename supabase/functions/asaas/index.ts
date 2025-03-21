
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

    // Receber as datas do request ou usar o mês atual como padrão
    const { startDate: customStartDate, endDate: customEndDate } = await req.json().catch(() => ({}));
    
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDate = customStartDate || startOfMonth.toISOString().split('T')[0]
    const endDate = customEndDate || today.toISOString().split('T')[0]

    console.log('Buscando pagamentos de:', startDate, 'até:', endDate)

    // Primeiro, buscar os pagamentos usando dueDate para filtrar
    const paymentsResponse = await fetch(
      `https://api.asaas.com/v3/payments?dueDate[ge]=${startDate}&dueDate[le]=${endDate}&limit=100`,
      {
        headers: {
          'access_token': asaasApiKey,
        },
      }
    )

    if (!paymentsResponse.ok) {
      throw new Error(`Erro na API do Asaas ao buscar pagamentos: ${paymentsResponse.statusText}`)
    }

    const paymentsData = await paymentsResponse.json()
    console.log('Dados de pagamentos recebidos do Asaas:', paymentsData)

    // Buscar informações dos clientes para cada pagamento
    const enrichedPayments = await Promise.all(paymentsData.data.map(async (payment: any) => {
      try {
        const customerResponse = await fetch(
          `https://api.asaas.com/v3/customers/${payment.customer}`,
          {
            headers: {
              'access_token': asaasApiKey,
            },
          }
        )

        if (!customerResponse.ok) {
          console.error(`Erro ao buscar cliente ${payment.customer}: ${customerResponse.statusText}`)
          return {
            ...payment,
            customerName: 'Cliente não encontrado'
          }
        }

        const customerData = await customerResponse.json()
        console.log('Dados do cliente recebidos:', customerData)

        return {
          ...payment,
          customerName: customerData.name || customerData.company || 'Nome não informado'
        }
      } catch (error) {
        console.error(`Erro ao buscar dados do cliente ${payment.customer}:`, error)
        return {
          ...payment,
          customerName: 'Erro ao buscar cliente'
        }
      }
    }))

    // Filtramos os pagamentos para garantir que estão dentro do período selecionado
    const filteredPayments = enrichedPayments.filter(payment => {
      const paymentDate = payment.paymentDate || payment.dueDate;
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    return new Response(
      JSON.stringify({ payments: filteredPayments }),
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
