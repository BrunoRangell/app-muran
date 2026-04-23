

# Template Premium "DashCortex" — Layout Fixo Ultra-Refinado

## Conceito

Criar um **template fixo, não-editável, com design premium** inspirado no print que você enviou (DashCortex). A ideia é ter um modelo "showcase" com qualidade visual superior aos blocos genéricos do editor — tudo desenhado pixel-a-pixel para impressionar.

A funcionalidade de templates editáveis continua existindo. Este novo template aparece como uma opção extra no seletor — **"DashCortex (Premium)"** — e quando selecionado, renderiza um componente React próprio totalmente desenhado à mão, ignorando o sistema de widgets.

## Características visuais do template

Reproduzindo fielmente a referência:

- **Tema escuro profundo** (`#0B0F1A` background, `#131829` cards) com toque de glassmorphism sutil — destaca dos relatórios claros atuais e transmite sofisticação
- **Header hero** "Overview" com logos coloridos das plataformas (Meta, Google Ads, Analytics) e badges de filtro/exportação no canto superior direito
- **Linha de 5 KPIs principais** com:
  - Ícone circular gradiente
  - Valor grande em destaque
  - Mini barra de progresso colorida (laranja Muran, azul, verde, amarelo, roxo) mostrando comparativo com período anterior
  - Percentual de variação
- **Card lateral de Orçamento** (Meta + Google) com mini-gráfico de distribuição linear
- **Dois grandes blocos lado a lado**: Meta Ads (gráfico de barras laranja com mini-resumo lateral de Investimento/Compras/Custo) e Google Ads (gráfico de barras verde com mesmo padrão)
- **Bloco Google Analytics** (acessos por dia, com totais ao lado)
- **Pizza/donut "Origem dos Acessos"** mostrando fontes de tráfego com legenda lateral
- **Tabela "Região"** com lista vertical de estados/cidades + valor de acessos e barra de gradiente laranja indicando proporção
- **Sidebar de navegação fixa à esquerda** (Overview, Meta Ads, Google Ads, Analytics, Mobile) — apenas visual, com Overview ativo destacado
- **Tipografia**: Space Grotesk (já usada no projeto) com pesos variados para hierarquia
- **Animações sutis**: fade-in escalonado dos cards, hover com elevação suave, números animando ao carregar

## Como será integrado

### Detecção e renderização
- Adicionar uma flag `isPremiumFixed: true` em metadados de templates específicos
- Em `ReportContent.tsx`, antes de cair no fluxo de widgets ou sections legadas, verificar se o template é "DashCortex" → renderiza `<DashCortexTemplate data={insightsData} />` direto
- O componente recebe os mesmos dados que o WidgetGridRenderer recebe hoje (overview, demographics, timeSeries, campaigns, etc.) e os mapeia para os blocos visuais fixos

### Disponibilização
- Inserir um registro fixo (ou seed) na tabela `report_templates` com:
  - `name`: "DashCortex (Premium)"
  - `is_global`: true
  - `sections`: `{ "premiumLayout": "dashcortex" }` — marcador especial
- Ele aparece automaticamente no `TemplateSelector` e no seletor do portal do cliente

### Onde testar
- Selecionar este template no seletor de relatórios → vê o novo layout
- Funciona também para portal do cliente (link público) → cliente vê o relatório premium
- Os outros templates editáveis seguem funcionando normalmente

## Arquivos

**Novos:**
- `src/components/traffic-reports/premium-templates/DashCortexTemplate.tsx` — componente principal do layout
- `src/components/traffic-reports/premium-templates/dashcortex/` — subcomponentes:
  - `KpiCard.tsx` (card de métrica com barra de progresso)
  - `PlatformBlock.tsx` (bloco grande Meta/Google com gráfico + resumo lateral)
  - `RegionTable.tsx` (tabela de regiões com barras)
  - `OriginPieChart.tsx` (donut de origem do tráfego)
  - `BudgetCard.tsx` (card lateral de orçamento)
  - `SidebarNav.tsx` (navegação visual lateral)
- Migração SQL — inserir o template "DashCortex (Premium)" globalmente

**Editados:**
- `src/components/traffic-reports/ReportContent.tsx` — detectar `sections.premiumLayout === 'dashcortex'` e renderizar `<DashCortexTemplate />` no lugar do fluxo normal

## Considerações técnicas

- O template usa apenas dados que já existem em `insightsData` — sem novas chamadas de API
- Quando uma seção não tem dados (ex.: cliente sem Google Analytics), o bloco é omitido graciosamente em vez de quebrar
- A sidebar lateral é puramente decorativa nesta primeira versão — clicar nela rola até a respectiva seção (scroll suave). Sem mudança de estado complexa
- Responsividade: mantém o layout fixo em desktop (≥1280px). Em telas menores, os blocos empilham verticalmente preservando a estética
- Uso intenso de `recharts` (já no projeto) para gráficos, com cores customizadas para cada plataforma

## Resultado esperado

Um template **"plug and play"** que você seleciona no dropdown e instantaneamente o relatório vira um dashboard premium estilo DashCortex — sem precisar configurar widgets, mover blocos ou ajustar nada. Ideal para clientes onde você quer apresentar algo "uau" sem trabalho de montagem.

