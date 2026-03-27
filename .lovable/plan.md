

# Corrigir erro ao excluir orçamento personalizado

## Problema
A tabela `budget_reviews` possui uma foreign key (`budget_reviews_custom_budget_id_fkey`) que referencia `custom_budgets(id)`. Quando um orçamento personalizado já foi usado em alguma revisão diária, a exclusão falha por violação de integridade referencial.

## Solução
Alterar a foreign key para usar `ON DELETE SET NULL`, permitindo que a exclusão do orçamento personalizado apenas limpe a referência nas revisões existentes (setando `custom_budget_id` para `NULL`). Isso é seguro porque as revisões já possuem os campos `custom_budget_amount`, `custom_budget_start_date` e `custom_budget_end_date` salvos diretamente, então não perdem informação.

## Mudança
Uma migration SQL:

```sql
ALTER TABLE budget_reviews 
  DROP CONSTRAINT budget_reviews_custom_budget_id_fkey;

ALTER TABLE budget_reviews 
  ADD CONSTRAINT budget_reviews_custom_budget_id_fkey 
  FOREIGN KEY (custom_budget_id) 
  REFERENCES custom_budgets(id) 
  ON DELETE SET NULL;
```

## Arquivo editado
- Nenhum arquivo de código precisa mudar. Apenas a migration no banco.

