# Descontinuar "Relatórios de Tráfego"

## Observação sobre o que existe hoje
Alguns itens pedidos já não existem no projeto, então não há o que remover:
- Rotas `/relatorios-trafego/templates`, `/templates/novo`, `/templates/editar/:templateId`
- Páginas `TrafficReportsTemplates`, `TrafficReportsViewer`, `TemplateEditorPage`
- Pasta `src/components/template-editor`
- Hooks `useReportTemplates`, `useTemplateEditor`, `useWidgetPresets`
- Arquivos `src/data/premiumTemplates.ts` e `src/data/mockPreviewData.ts`

## Arquivos que serão REMOVIDOS
- `src/pages/TrafficReports.tsx`
- `src/pages/TrafficReportsDashboard.tsx`
- `src/hooks/useTrafficInsights.ts`
- `src/hooks/useClientPortal.ts`
- `src/hooks/useTrafficReportData.ts` (usado só pelo relatório de tráfego)
- `src/components/layout/ClientPortalLayout.tsx` (usado só pelo portal antigo)
- Pasta inteira `src/components/traffic-reports/` (23 arquivos + `premium-templates/dashcortex/` com 6 arquivos)
- `supabase/functions/traffic-insights/` (pasta da função) e exclusão da função publicada

## Arquivos que serão ALTERADOS
- `src/App.tsx`: remover imports e as rotas `/relatorios-trafego` e `/relatorios-trafego/visualizar`; `/cliente/:accessToken` passa a usar a nova página.
- `src/components/layout/Sidebar.tsx`: remover os 2 itens "Relatórios de Tráfego" (linhas 56 e 66, um por perfil de menu).
- `supabase/config.toml`: remover o bloco `[functions.traffic-insights]`.

## Arquivo que será CRIADO
- `src/pages/ReportMoved.tsx`: página simples, centralizada, com o logo da Muran e o texto "Seu relatório mudou de endereço. Fale com a Muran para receber o novo link." Sem login, sem consulta ao banco.

## Não será tocado
Relatório Financeiro e demais relatórios, revisões diárias, saúde de campanhas, alertas, token Meta, ClickUp, públicos, onboarding/offboarding, `supabase/functions/_shared`, outras funções, banco de dados (nenhuma migration; `client_portals`, `report_templates`, `widget_presets` ficam).

## Verificação
Checar build sem erros, abrir `/cliente/qualquer-token` e confirmar a mensagem, e confirmar que o menu não mostra mais o item.
