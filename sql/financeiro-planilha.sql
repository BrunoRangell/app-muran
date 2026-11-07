-- Financeiro Muran ← planilha "Financeiro Muran.xlsx" (abas "Receitas {ano}" e "Despesas {ano}", de 2024 em diante).
-- Rodar no projeto "Muran Supabase" (socrnutfpqtcjmetskta). Pode rodar de novo. Sem tabelas temporárias.
--
-- O que faz:
--   1) backup de recebimentos e custos atuais (tabelas *_backup_planilha)
--   2) marca a origem de cada recebimento/custo (coluna source) e o nome das "Outras receitas" (coluna label)
--   3) apaga os lançamentos manuais de 2024 em diante (a planilha passa a ser a fonte; antes de 2024 fica como está)
--   4) cria os apelidos planilha → cliente (ex.: "Ju Lenz" = Juliana Lenz; "Skincorpus" = Dr Glauber + Dra Fernanda)
--   5) cria a função que grava tudo de uma vez (usada pela rotina) e o registro de cada sincronização
--   6) agenda a rotina todo dia às 6h (Brasília)

begin;

-- 1) backup (só na primeira vez)
create table if not exists public.payments_backup_planilha as table public.payments;
create table if not exists public.costs_backup_planilha as table public.costs;
create table if not exists public.costs_categories_backup_planilha as table public.costs_categories;
alter table public.payments_backup_planilha enable row level security;
alter table public.costs_backup_planilha enable row level security;
alter table public.costs_categories_backup_planilha enable row level security;

-- 2) origem e rótulo
alter table public.payments add column if not exists source text;
alter table public.payments add column if not exists label text;
alter table public.costs add column if not exists source text;

-- 3) lançamentos manuais de 2024 em diante saem (a planilha traz tudo de novo, mais completo)
delete from public.costs_categories
where cost_id in (select id from public.costs where date >= '2024-01-01' and source is null);
delete from public.costs where date >= '2024-01-01' and source is null;
delete from public.payments where reference_month >= '2024-01-01' and source is null;

-- 4) apelidos: nome na planilha → cliente(s) do App (vários = divide pelo valor do contrato)
create table if not exists public.finance_sheet_aliases (
  sheet_name text primary key,
  client_ids uuid[] not null
);
alter table public.finance_sheet_aliases enable row level security;
drop policy if exists "finance_sheet_aliases admin" on public.finance_sheet_aliases;
create policy "finance_sheet_aliases admin" on public.finance_sheet_aliases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.finance_sheet_aliases (sheet_name, client_ids)
select v.sheet_name, array(select c.id from public.clients c where c.company_name = any (v.names))
from (values
  ('Ju Lenz', array['Juliana Lenz']),
  ('Aracuri - Respira', array['Aracuri Vinhos']),
  ('Jardim das Flores - Respira', array['Jardim das Flores']),
  ('Country Imobiliária 1270', array['Country Negócios Imobiliários']),
  ('DreamFit', array['Dream Fit']),
  ('Escola Dayse Gonçalves', array['CE Dayse Gonçalves']),
  ('F.A Colchões', array['FA Colchoes']),
  ('Móvel na Caixa 1697', array['Móvel na Caixa']),
  ('Paloma Priebe 1847', array['Paloma Priebe']),
  ('CWR 1270', array['CWR']),
  ('Garbo', array['Garbo Negócios Imobiliários']),
  ('Skincorpus', array['Dr Glauber Marinho', 'Dra Fernanda Almeida'])
) as v(sheet_name, names)
on conflict (sheet_name) do update set client_ids = excluded.client_ids;

-- 5) registro das sincronizações
create table if not exists public.finance_sync_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  status text not null,
  summary jsonb
);
alter table public.finance_sync_runs enable row level security;
drop policy if exists "finance_sync_runs leitura" on public.finance_sync_runs;
create policy "finance_sync_runs leitura" on public.finance_sync_runs for select to authenticated
  using (public.is_team_member());

-- grava o que veio da planilha numa transação só (troca os lançamentos "planilha" dos anos lidos)
create or replace function public.finance_apply_sheet(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  anos int[] := array(select jsonb_array_elements_text(p->'years')::int);
  n_pay int;
  n_cost int;
begin
  delete from costs_categories
  where cost_id in (select id from costs where source = 'planilha' and extract(year from date)::int = any (anos));
  delete from costs where source = 'planilha' and extract(year from date)::int = any (anos);
  delete from payments where source = 'planilha' and extract(year from reference_month)::int = any (anos);

  insert into payments (client_id, amount, reference_month, notes, source, label)
  select nullif(x->>'client_id', '')::uuid, (x->>'amount')::numeric, (x->>'month')::date,
         x->>'notes', 'planilha', nullif(x->>'label', '')
  from jsonb_array_elements(p->'payments') x;
  get diagnostics n_pay = row_count;

  with novos as (
    insert into costs (name, amount, date, description, source, original_name, name_customized)
    select x->>'name', (x->>'amount')::numeric, (x->>'month')::date, x->>'section', 'planilha', x->>'name', false
    from jsonb_array_elements(p->'costs') x
    returning id, name, date
  ), cat as (
    select distinct on (n.id) n.id, x->>'category' as category
    from novos n
    join jsonb_array_elements(p->'costs') x
      on x->>'name' = n.name and (x->>'month')::date = n.date
  )
  insert into costs_categories (cost_id, category_id)
  select id, category from cat where category is not null;
  select count(*) into n_cost from costs where source = 'planilha' and extract(year from date)::int = any (anos);

  insert into finance_sync_runs (status, summary)
  values ('ok', jsonb_build_object('anos', to_jsonb(anos), 'recebimentos', n_pay, 'custos', n_cost,
                                   'sem_cadastro', coalesce(p->'unmatched', '[]'::jsonb)));
  return jsonb_build_object('recebimentos', n_pay, 'custos', n_cost);
end $$;

revoke execute on function public.finance_apply_sheet(jsonb) from public, anon, authenticated;

commit;

-- 6) rotina diária: 09:00 UTC = 06:00 em Brasília
select cron.unschedule(jobid) from cron.job where jobname = 'financeiro-planilha-06h-brt';
select cron.schedule('financeiro-planilha-06h-brt', '0 9 * * *', $cron$
  select net.http_post(
    url := 'https://socrnutfpqtcjmetskta.supabase.co/functions/v1/sync-financeiro-planilha',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
$cron$);

-- conferência
select
  (select count(*) from public.payments_backup_planilha) as backup_recebimentos,
  (select count(*) from public.finance_sheet_aliases) as apelidos,
  (select count(*) from cron.job where jobname = 'financeiro-planilha-06h-brt') as rotina;
-- esperado: 535 | 12 | 1
