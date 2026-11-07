import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Recebimentos e custos vêm da planilha "Financeiro Muran" (abas "Receitas {ano}" e "Despesas {ano}").
 * A rotina sync-financeiro-planilha atualiza tudo todo dia às 6h; este aviso mostra a última vez e permite sincronizar na hora.
 */
interface SyncRun {
  ran_at: string;
  status: string;
  summary: { recebimentos?: number; custos?: number; sem_cadastro?: string[]; erro?: string } | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function FinanceSheetSync() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [showNames, setShowNames] = useState(false);

  const { data: last } = useQuery({
    queryKey: ["finance-sync-last"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("finance_sync_runs")
        .select("ran_at, status, summary")
        .order("ran_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as SyncRun | null;
    },
  });

  const syncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-financeiro-planilha", { body: {} });
      if (error || !data?.ok) throw new Error(error?.message ?? "Falha na sincronização");
      toast({ title: "Planilha sincronizada", description: data.skipped ?? "Recebimentos e custos atualizados." });
      qc.invalidateQueries();
    } catch (e) {
      toast({ title: "Não consegui sincronizar", description: String((e as Error).message), variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["finance-sync-last"] });
    } finally {
      setSyncing(false);
    }
  };

  const names = last?.summary?.sem_cadastro ?? [];

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-700" />
        <span className="text-emerald-900">
          Dados vindos da planilha <b>Financeiro Muran</b>, atualizados todo dia às 6h.
          {last && (
            <span className="text-emerald-800/80">
              {" "}Última sincronização: {fmt(last.ran_at)}
              {last.status !== "ok" && <span className="font-medium text-red-600"> (com erro)</span>}
            </span>
          )}
        </span>
        <Button size="sm" variant="outline" className="ml-auto h-8 gap-1.5 bg-white" onClick={syncNow} disabled={syncing}>
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando…" : "Sincronizar agora"}
        </Button>
      </div>
      {last?.status !== "ok" && last?.summary?.erro && (
        <p className="mt-2 flex items-start gap-1.5 text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {last.summary.erro}
        </p>
      )}
      {names.length > 0 && (
        <div className="mt-2 text-emerald-900/80">
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => setShowNames((v) => !v)}>
            {names.length} {names.length === 1 ? "nome entra" : "nomes entram"} como "Outras receitas" (sem cadastro de cliente)
          </button>
          {showNames && <p className="mt-1 text-xs">{names.join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}
