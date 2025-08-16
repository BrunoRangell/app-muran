
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "../types";
import { CostCategory } from "@/types/cost";

interface CreatedCost {
  id: number;
  name: string;
  amount: number;
  date: string;
}

export async function createCost(transaction: Transaction, categoryId?: CostCategory): Promise<CreatedCost> {
  // Inserir o custo
  console.log("[Custo] Inserindo custo para transação com dados:", {
    name: transaction.name,
    original_name: transaction.originalName || transaction.name,
    name_customized: transaction.originalName !== undefined && transaction.originalName !== transaction.name,
    amount: transaction.amount,
    date: transaction.date,
  });

  const { data: cost, error: costError } = await supabase
    .from('costs')
    .insert({
      name: transaction.name,
      original_name: transaction.originalName || transaction.name,
      name_customized: transaction.originalName !== undefined && transaction.originalName !== transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      description: null,
    })
    .select('*')
    .maybeSingle();

  if (costError) {
    console.error("[Custo] Erro ao inserir:", costError);
    throw costError;
  }

  if (!cost) {
    console.error("[Custo] Não foi criado corretamente");
    throw new Error("Custo não foi criado corretamente");
  }

  console.log("[Custo] Criado com sucesso:", cost);
  return cost;
}

export async function assignCategoryToCost(costId: number, categoryId?: CostCategory) {
  if (!categoryId) return; // Skip if no category provided
  console.log("[Categoria] Inserindo relação com custo. ID:", costId, "Categoria:", categoryId);
  const { error: categoriesError } = await supabase
    .from('costs_categories')
    .insert({
      cost_id: costId,
      category_id: categoryId
    });

  if (categoriesError) {
    console.error("[Categoria] Erro ao inserir:", categoriesError);
    throw categoriesError;
  }

  console.log("[Categoria] Relação criada com sucesso");
}

export async function registerImportedTransaction(fitId: string, costId: number) {
  console.log("[Importação] Registrando transação. FitId:", fitId, "CostId:", costId);
  const { error: importError } = await supabase
    .from('imported_transactions')
    .insert({
      fitid: fitId,
      cost_id: costId
    });

  if (importError) {
    console.error("[Importação] Erro ao registrar:", importError);
    throw importError;
  }

  console.log("[Importação] Transação registrada com sucesso");
}
