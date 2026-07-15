import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

// Tipagem local para o namespace beta supabase.auth.oauth
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function isSafeRelative(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Parâmetro authorization_id ausente.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        const safe = isSafeRelative(next) ? next : "/";
        window.location.href = "/login?returnTo=" + encodeURIComponent(safe);
        return;
      }
      const oauthApi = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
      if (!oauthApi?.getAuthorizationDetails) {
        setError(
          "Servidor OAuth 2.1 do Supabase indisponível neste projeto. Habilite o Authorization Server no painel do Supabase."
        );
        return;
      }
      const { data, error: detErr } = await oauthApi.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detErr) {
        setError(detErr.message ?? "Não foi possível carregar a autorização.");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauthApi = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
    const { data, error: decErr } = approve
      ? await oauthApi.approveAuthorization(authorizationId)
      : await oauthApi.denyAuthorization(authorizationId);
    if (decErr) {
      setBusy(false);
      setError(decErr.message ?? "Falha ao processar a decisão.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não retornou uma URL de redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f0f0f] text-white">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-6 space-y-3">
          <h1 className="text-xl font-semibold">Não foi possível carregar</h1>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f0f0f] text-white">
        <div className="flex items-center gap-3 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando autorização…</span>
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "um aplicativo";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f0f0f] text-white">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#ff6e00]/15 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#ff6e00]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Conectar {clientName} ao Muran APP</h1>
            <p className="text-xs text-white/60">Isso permite que {clientName} use o app agindo como você.</p>
          </div>
        </div>
        <p className="text-sm text-white/70">
          As ferramentas MCP terão acesso somente aos dados que sua conta já pode ver, seguindo as políticas de
          segurança do banco (RLS).
        </p>
        <div className="flex gap-2 pt-2">
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 bg-[#ff6e00] hover:bg-[#e56200] text-white"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprovar"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(false)}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/5"
          >
            Recusar
          </Button>
        </div>
      </div>
    </main>
  );
}
