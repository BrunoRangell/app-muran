## Objetivo

Permitir refazer o onboarding parcialmente concluído da Dra. Fernanda Almeida (e casos futuros) sem duplicar o que já foi criado. Google Drive, Discord e a lista **Onboarding** do ClickUp já estão prontos — falta apenas criar as demais listas do template (Relacionamento, Vendas, etc.) dentro da pasta existente.

## Pré-requisito importante

O erro original foi `HLIMIT_005 — list limit for this space`. Antes de retentar, o limite do Space precisa estar liberado (upgrade do plano, arquivamento de listas antigas, ou movendo clientes antigos para outro Space). Caso contrário o retry vai falhar com o mesmo erro.

## O que será feito

### 1. Nova edge function `retry-clickup-onboarding`

Fluxo:
1. Recebe `clientName`.
2. Busca a pasta existente no Space (`GET /space/{SPACE_ID}/folder`) pelo nome exato do cliente. Se não existir, retorna erro claro pedindo para rodar o onboarding completo.
3. Lista as listas atuais da pasta e as listas do template.
4. Calcula o diff: apenas listas do template que **não existem** na pasta do cliente serão criadas.
5. Para cada lista faltante, reaproveita a mesma lógica de `create-clickup-project`:
   - cria a lista;
   - copia tarefas do template (com nome customizado por cliente, assignees, tags, status, due date da lista de Onboarding se aplicável);
   - configura a view customizada se for "Onboarding" (não deve ocorrer aqui, já existe).
6. Retorna resumo: listas criadas, listas puladas (já existiam), erros por lista (sem quebrar tudo se uma falhar).

### 2. UI: botão "Retentar ClickUp" na tela de resultado do onboarding

Na tela que mostra o status `partial`/`failed`, quando o ClickUp falhou ou ficou incompleto:
- Adicionar botão **"Retentar ClickUp"**.
- Ao clicar, chama a nova edge function com o `clientName`.
- Mostra toast/dialog com o resumo (listas criadas x puladas x erros).
- Se hit no `HLIMIT_005`, mostra mensagem explicando que o Space está no limite e o que fazer.

### Ação imediata para a Dra. Fernanda

Depois de fazer o deploy, basta clicar em "Retentar ClickUp" na tela dela (ou eu disparo a função direto pelo painel/tool caso prefira, sem precisar reabrir o fluxo).

## Detalhes técnicos

- Arquivos novos:
  - `supabase/functions/retry-clickup-onboarding/index.ts`
- Arquivos alterados:
  - `src/pages/Onboarding.tsx` (ou o componente que exibe o resultado do orchestrator) para incluir o botão condicional e chamar `supabase.functions.invoke('retry-clickup-onboarding', { body: { clientName } })`.
- Sem migrações de banco.
- Reaproveita os secrets já existentes (`CLICKUP_TOKEN`, `CLICKUP_SPACE_ID`, `CLICKUP_TEMPLATE_FOLDER_ID`).

## Fora de escopo

- Retentar Google Drive / Discord (já concluíram).
- Alterar limite de listas no ClickUp (ação manual do usuário na conta ClickUp).