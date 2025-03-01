
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { DateTime } from 'https://cdn.skypack.dev/luxon'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para normalizar texto
const normalizeText = (text: string) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .toLowerCase();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com chave de serviço para acessar dados protegidos
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obter tokens necessários do banco de dados
    const { data: tokens, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')

    if (tokensError) {
      console.error('Erro ao buscar tokens:', tokensError)
      return new Response(JSON.stringify({ error: 'Erro ao obter configurações de API' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Mapear tokens para um objeto de configuração
    const config: Record<string, string> = {}
    tokens.forEach((token) => {
      config[token.name] = token.value
    })

    // Verificar se temos os tokens necessários
    const requiredTokens = ['meta_access_token', 'clickup_token', 'space_id', 'google_developer_token', 'google_oauth2_token', 'manager_customer_id']
    const missingTokens = requiredTokens.filter(token => !config[token] || config[token].trim() === '')

    if (missingTokens.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Tokens de API ausentes', 
        missingTokens 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Obter método da requisição
    const { method } = await req.json()

    // Roteamento de métodos
    switch (method) {
      case 'getClients':
        return await getClients(req, supabase, corsHeaders)
      case 'analyzeClient':
        return await analyzeClient(req, supabase, corsHeaders, config)
      case 'getReviews':
        return await getReviews(req, supabase, corsHeaders)
      case 'saveTokens':
        return await saveTokens(req, supabase, corsHeaders)
      default:
        return new Response(JSON.stringify({ error: 'Método não reconhecido' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
    }
  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// Funções para manipulação de requisições

async function getClients(req: Request, supabase: any, corsHeaders: any) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('company_name', { ascending: true })

    if (error) throw error

    return new Response(JSON.stringify({ clients: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

async function getReviews(req: Request, supabase: any, corsHeaders: any) {
  try {
    const { clientId, date } = await req.json()
    
    let query = supabase
      .from('daily_budget_reviews')
      .select(`
        *,
        clients(company_name)
      `)
      .order('review_date', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (date) {
      query = query.eq('review_date', date)
    } else {
      // Se data não for especificada, pegar apenas revisões dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const formattedDate = sevenDaysAgo.toISOString().split('T')[0]
      query = query.gte('review_date', formattedDate)
    }

    const { data, error } = await query

    if (error) throw error

    return new Response(JSON.stringify({ reviews: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Erro ao buscar revisões:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

async function saveTokens(req: Request, supabase: any, corsHeaders: any) {
  try {
    const { tokens } = await req.json()
    
    if (!tokens || !Array.isArray(tokens)) {
      throw new Error('Formato de tokens inválido')
    }

    // Atualizar tokens no banco de dados
    for (const token of tokens) {
      const { error } = await supabase
        .from('api_tokens')
        .update({ value: token.value })
        .eq('name', token.name)

      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Erro ao salvar tokens:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

async function analyzeClient(req: Request, supabase: any, corsHeaders: any, config: any) {
  try {
    const { clientId } = await req.json()

    // Buscar informações do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) throw clientError
    
    // Verificar se o cliente existe
    if (!client) {
      return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Cálculos do orçamento
    const today = DateTime.now().setZone('America/Sao_Paulo')
    const daysInMonth = today.daysInMonth
    const daysLeft = daysInMonth - today.day + 1

    // Análise de contas Meta Ads
    let metaData = await analyzeMetaAds(client.company_name, config)
    
    // Análise de contas Google Ads
    let googleData = await analyzeGoogleAds(client.company_name, config)

    // Adicionar mais logs para verificar o progresso
    console.log('Dados Meta obtidos:', JSON.stringify(metaData))
    console.log('Dados Google obtidos:', JSON.stringify(googleData))

    // Só continuar se tiver dados de pelo menos uma plataforma
    if (Object.keys(metaData).length === 0 && Object.keys(googleData).length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Nenhuma conta de anúncios encontrada para o cliente',
        client
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Calcular recomendações Meta Ads
    let metaRecommendation = ''
    if (Object.keys(metaData).length > 0) {
      const metaBudgetAvailable = client.meta_ads_budget || 0
      const metaSpendLeft = metaBudgetAvailable - metaData.totalSpend
      const metaDailyBudget = metaSpendLeft / daysLeft
      const metaSuggestedDailyBudget = metaDailyBudget - metaData.totalBudget
      metaRecommendation = metaSuggestedDailyBudget >= 0 ? 
        `Aumentar R$${Math.abs(metaSuggestedDailyBudget).toFixed(2)}` : 
        `Diminuir R$${Math.abs(metaSuggestedDailyBudget).toFixed(2)}`
    }

    // Calcular recomendações Google Ads
    let googleRecommendation = ''
    if (Object.keys(googleData).length > 0) {
      const googleBudgetAvailable = client.google_ads_budget || 0
      const googleSpendLeft = googleBudgetAvailable - googleData.totalSpend
      const googleDailyBudget = googleSpendLeft / daysLeft
      const googleSuggestedDailyBudget = googleDailyBudget - googleData.totalBudget
      googleRecommendation = googleSuggestedDailyBudget >= 0 ? 
        `Aumentar R$${Math.abs(googleSuggestedDailyBudget).toFixed(2)}` : 
        `Diminuir R$${Math.abs(googleSuggestedDailyBudget).toFixed(2)}`
    }

    // Salvar dados calculados na tabela de revisões
    const reviewData = {
      client_id: clientId,
      review_date: today.toISODate(),
      // Meta Ads
      meta_budget_available: client.meta_ads_budget || 0,
      meta_total_spent: metaData.totalSpend || 0,
      meta_daily_budget_current: metaData.totalBudget || 0,
      meta_daily_budget_ideal: metaData.totalSpend ? (client.meta_ads_budget - metaData.totalSpend) / daysLeft : 0,
      meta_recommendation: metaRecommendation,
      meta_account_id: metaData.accountId || null,
      meta_account_name: metaData.accountName || null,
      // Google Ads
      google_budget_available: client.google_ads_budget || 0,
      google_total_spent: googleData.totalSpend || 0,
      google_daily_budget_current: googleData.totalBudget || 0,
      google_daily_budget_ideal: googleData.totalSpend ? (client.google_ads_budget - googleData.totalSpend) / daysLeft : 0,
      google_avg_last_five_days: googleData.lastFiveDaysAvg || 0,
      google_recommendation: googleRecommendation,
      google_account_id: googleData.accountId || null,
      google_account_name: googleData.accountName || null
    }

    // Verificar se já existe uma revisão para hoje
    const { data: existingReview, error: existingError } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('review_date', today.toISODate())
      .maybeSingle()

    let saveResult
    if (existingReview) {
      // Atualizar revisão existente
      saveResult = await supabase
        .from('daily_budget_reviews')
        .update(reviewData)
        .eq('id', existingReview.id)
    } else {
      // Inserir nova revisão
      saveResult = await supabase
        .from('daily_budget_reviews')
        .insert(reviewData)
    }

    if (saveResult.error) throw saveResult.error

    // Atualizar dados do cliente se necessário
    const clientUpdateData = {}
    if (metaData.accountId && !client.meta_account_id) {
      clientUpdateData.meta_account_id = metaData.accountId
    }
    if (googleData.accountId && !client.google_account_id) {
      clientUpdateData.google_account_id = googleData.accountId
    }

    if (Object.keys(clientUpdateData).length > 0) {
      const { error: updateError } = await supabase
        .from('clients')
        .update(clientUpdateData)
        .eq('id', clientId)

      if (updateError) throw updateError
    }

    return new Response(JSON.stringify({
      success: true,
      client,
      daysLeft,
      meta: {
        ...metaData,
        recommendation: metaRecommendation,
        idealDailyBudget: metaData.totalSpend ? (client.meta_ads_budget - metaData.totalSpend) / daysLeft : 0,
        budgetAvailable: client.meta_ads_budget || 0
      },
      google: {
        ...googleData,
        recommendation: googleRecommendation,
        idealDailyBudget: googleData.totalSpend ? (client.google_ads_budget - googleData.totalSpend) / daysLeft : 0,
        budgetAvailable: client.google_ads_budget || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Erro ao analisar cliente:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}

// Funções para integração com Meta Ads
async function analyzeMetaAds(clientName: string, config: any) {
  try {
    console.log(`Analisando Meta Ads para cliente ${clientName}`)
    const accessToken = config.meta_access_token

    if (!accessToken) {
      console.log('Token de acesso Meta Ads não encontrado')
      return {}
    }

    // Função para buscar contas de anúncios
    const fetchMetaAccounts = async () => {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/me/adaccounts?fields=name,account_id&access_token=${accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar contas Meta: ${await response.text()}`)
      }
      
      const data = await response.json()
      return data.data || []
    }

    // Buscar contas de anúncios e filtrar pelo nome do cliente
    const accounts = await fetchMetaAccounts()
    console.log(`Encontradas ${accounts.length} contas Meta Ads`)
    
    const matchedAccounts = accounts.filter((account: any) => 
      normalizeText(account.name).includes(normalizeText(clientName))
    )

    if (matchedAccounts.length === 0) {
      console.log(`Nenhuma conta Meta Ads encontrada para ${clientName}`)
      return {}
    }

    // Usar a primeira conta correspondente (pode ser melhorado para escolher a melhor correspondência)
    const account = matchedAccounts[0]
    const accountId = account.account_id

    // Buscar insights para calcular o gasto total
    const today = DateTime.now().setZone('America/Sao_Paulo')
    const timeRange = {
      since: today.startOf('month').toISODate(),
      until: today.toISODate()
    }

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${accountId}/insights?fields=spend&time_range=${encodeURIComponent(JSON.stringify(timeRange))}&access_token=${accessToken}`
    )
    
    if (!insightsResponse.ok) {
      throw new Error(`Erro ao buscar insights Meta: ${await insightsResponse.text()}`)
    }
    
    const insightsData = await insightsResponse.json()
    const totalSpend = insightsData.data?.reduce((sum: number, insight: any) => 
      sum + parseFloat(insight.spend || 0), 0
    ) || 0

    // Buscar campanhas para calcular o orçamento diário atual
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time&access_token=${accessToken}`
    )
    
    if (!campaignsResponse.ok) {
      throw new Error(`Erro ao buscar campanhas Meta: ${await campaignsResponse.text()}`)
    }
    
    const campaignsData = await campaignsResponse.json()
    const campaigns = campaignsData.data || []

    // Calcular orçamento total das campanhas ativas
    let totalBudget = 0
    for (const campaign of campaigns) {
      if (campaign.status === 'ACTIVE') {
        totalBudget += parseFloat(campaign.daily_budget || 0)
      }
    }

    // Converter de centavos para reais
    totalBudget = totalBudget / 100

    return {
      accountId,
      accountName: account.name,
      totalSpend,
      totalBudget
    }
  } catch (error) {
    console.error('Erro ao analisar Meta Ads:', error)
    return {}
  }
}

// Funções para integração com Google Ads
async function analyzeGoogleAds(clientName: string, config: any) {
  try {
    console.log(`Analisando Google Ads para cliente ${clientName}`)
    const developerToken = config.google_developer_token
    const oauth2AccessToken = config.google_oauth2_token
    const managerCustomerId = config.manager_customer_id

    if (!developerToken || !oauth2AccessToken || !managerCustomerId) {
      console.log('Tokens Google Ads não encontrados')
      return {}
    }

    // Função para buscar clientes do Google Ads
    const fetchGoogleAccounts = async () => {
      const query = `
        SELECT
          customer_client.id,
          customer_client.level,
          customer_client.descriptive_name
        FROM
          customer_client
        WHERE
          customer_client.manager = FALSE
      `

      const response = await fetch(
        `https://googleads.googleapis.com/v18/customers/${managerCustomerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'developer-token': developerToken,
            'Authorization': `Bearer ${oauth2AccessToken}`
          },
          body: JSON.stringify({ query })
        }
      )
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar contas Google: ${await response.text()}`)
      }
      
      const data = await response.json()
      return data.results?.map((client: any) => ({
        customerId: client.customerClient?.id || '',
        name: client.customerClient?.descriptiveName || ''
      })) || []
    }

    // Buscar contas de cliente e filtrar pelo nome do cliente
    const accounts = await fetchGoogleAccounts()
    console.log(`Encontradas ${accounts.length} contas Google Ads`)
    
    const matchedAccounts = accounts.filter((account: any) => 
      normalizeText(account.name).includes(normalizeText(clientName))
    )

    if (matchedAccounts.length === 0) {
      console.log(`Nenhuma conta Google Ads encontrada para ${clientName}`)
      return {}
    }

    // Usar a primeira conta correspondente
    const account = matchedAccounts[0]
    const customerId = account.customerId

    // Calcular o gasto mensal
    const today = DateTime.now().setZone('America/Sao_Paulo')
    const startDate = today.startOf('month').toISODate()
    const endDate = today.toISODate()
    const fiveDaysAgo = today.minus({ days: 5 }).toISODate()

    const query = `
      SELECT
        metrics.cost_micros,
        campaign.id,
        campaign.name,
        segments.date
      FROM
        campaign
      WHERE
        segments.date BETWEEN '${startDate}' AND '${endDate}'
    `

    const spendResponse = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'developer-token': developerToken,
          'login-customer-id': managerCustomerId,
          'Authorization': `Bearer ${oauth2AccessToken}`
        },
        body: JSON.stringify({ query })
      }
    )
    
    if (!spendResponse.ok) {
      throw new Error(`Erro ao buscar gasto Google: ${await spendResponse.text()}`)
    }
    
    const spendData = await spendResponse.json()
    const campaigns = spendData.results || []

    // Calcular gasto total
    let totalSpend = 0
    let lastFiveDaysSpend = 0
    let uniqueDates = new Set()

    campaigns.forEach((campaign: any) => {
      const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0
      totalSpend += cost

      const date = campaign.segments?.date
      if (date && date >= fiveDaysAgo && date < today.toISODate()) {
        lastFiveDaysSpend += cost
        uniqueDates.add(date)
      }
    })

    const lastFiveDaysAvg = uniqueDates.size > 0 ? lastFiveDaysSpend / uniqueDates.size : 0

    // Buscar orçamento diário atual
    const budgetQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros
      FROM
        campaign
    `

    const budgetResponse = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'developer-token': developerToken,
          'login-customer-id': managerCustomerId,
          'Authorization': `Bearer ${oauth2AccessToken}`
        },
        body: JSON.stringify({ query: budgetQuery })
      }
    )
    
    if (!budgetResponse.ok) {
      throw new Error(`Erro ao buscar orçamentos Google: ${await budgetResponse.text()}`)
    }
    
    const budgetData = await budgetResponse.json()
    const budgetCampaigns = budgetData.results || []

    // Calcular orçamento total das campanhas ativas
    let totalBudget = 0
    budgetCampaigns.forEach((campaign: any) => {
      if (campaign.campaign?.status === 'ENABLED' && campaign.campaignBudget?.amountMicros) {
        totalBudget += campaign.campaignBudget.amountMicros / 1e6
      }
    })

    return {
      accountId: customerId,
      accountName: account.name,
      totalSpend,
      totalBudget,
      lastFiveDaysAvg
    }
  } catch (error) {
    console.error('Erro ao analisar Google Ads:', error)
    return {}
  }
}
