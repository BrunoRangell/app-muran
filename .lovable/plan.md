# Lista completa de clientes + pesquisa no Novo Orçamento Personalizado

## Problema
O campo "Cliente" do formulário de orçamento personalizado usa a busca paginada de clientes, que traz só a primeira página. Por isso clientes como Verena Imóveis não aparecem.

## O que muda
1. O campo passa a carregar **todos os clientes ativos**, em ordem alfabética.
2. O seletor vira uma caixa com **pesquisa**: ao digitar parte do nome (ex.: "verena"), a lista filtra na hora, sem diferenciar acentos nem maiúsculas.
3. O restante do formulário (conta, valor, datas) continua igual.

## Detalhes técnicos
- `CustomBudgetForm.tsx`: trocar `useClientsPaginated` por uma consulta direta a `clients` (`status = 'active'`, `id, company_name`, ordenado por nome).
- Substituir o `Select` por Popover + `Command` (shadcn) com `CommandInput`, filtro normalizado (sem acentos) e item marcado com check.
