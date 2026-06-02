import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, RefreshCw, Search, Megaphone, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useMetaClientAccounts } from "@/hooks/useMetaClientAccounts";
import { useActiveAds, type ActiveAd } from "@/hooks/useActiveAds";
import { proxiedImageUrl } from "@/lib/metaImageProxy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "Ativo", dot: "bg-emerald-500" },
  PAUSED: { label: "Pausado", dot: "bg-amber-500" },
  DELETED: { label: "Excluído", dot: "bg-zinc-500" },
  ARCHIVED: { label: "Arquivado", dot: "bg-zinc-500" },
  DISAPPROVED: { label: "Reprovado", dot: "bg-red-500" },
};

function statusBadge(status: string) {
  const cfg = STATUS_LABEL[status] || { label: status, dot: "bg-zinc-400" };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
      <span className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export default function AnunciosAtivos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const initialClient = params.get("client") || "";
  const initialAccount = params.get("account") || "";

  const { data: accounts = [], isLoading: loadingAccounts } = useMetaClientAccounts();

  const [clientId, setClientId] = useState<string>(initialClient);
  const [accountRowId, setAccountRowId] = useState<string>(initialAccount);
  const [includePaused, setIncludePaused] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const clientsOptions = useMemo(() => {
    const seen = new Map<string, string>();
    accounts.forEach((a) => seen.set(a.client_id, a.client_name));
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  const accountsForClient = useMemo(
    () => accounts.filter((a) => a.client_id === clientId),
    [accounts, clientId],
  );

  // Auto-select única conta
  useMemo(() => {
    if (clientId && accountsForClient.length === 1 && !accountRowId) {
      setAccountRowId(accountsForClient[0].id);
    }
    if (clientId && !accountsForClient.find((a) => a.id === accountRowId)) {
      // troca de cliente: limpa conta inválida
      if (accountsForClient.length === 1) setAccountRowId(accountsForClient[0].id);
      else setAccountRowId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, accountsForClient.length]);

  const statuses = includePaused ? ["ACTIVE", "PAUSED"] : ["ACTIVE"];
  const { data, isLoading, isFetching, refetch, error } = useActiveAds(accountRowId || null, statuses);

  const allAds: ActiveAd[] = data?.ads || [];

  const campaignsList = useMemo(() => {
    const map = new Map<string, string>();
    allAds.forEach((ad) => {
      if (ad.campaign_id) map.set(ad.campaign_id, ad.campaign_name || ad.campaign_id);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAds]);

  const filteredAds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allAds.filter((ad) => {
      if (campaignFilter.length > 0 && !campaignFilter.includes(ad.campaign_id || "")) return false;
      if (q && !(ad.name || "").toLowerCase().includes(q) && !(ad.campaign_name || "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [allAds, campaignFilter, search]);

  const onChangeClient = (id: string) => {
    setClientId(id);
    setAccountRowId("");
    setCampaignFilter([]);
    setParams({ client: id });
  };

  const onChangeAccount = (id: string) => {
    setAccountRowId(id);
    setCampaignFilter([]);
    setParams({ client: clientId, account: id });
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const safe = (data?.client?.company_name || "anuncios").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      link.download = `anuncios-${safe}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e: any) {
      toast({
        title: "Erro ao exportar",
        description: e?.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCopyText = async () => {
    if (!data) return;
    const lines = [
      `Anúncios ativos — ${data.client.company_name}`,
      `Conta: ${data.account.account_name || data.account.account_id}`,
      `Total: ${filteredAds.length}`,
      "",
      ...filteredAds.map((ad, i) => `${i + 1}. ${ad.name || "Sem nome"}${ad.campaign_name ? ` — ${ad.campaign_name}` : ""}`),
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    toast({ title: "Lista copiada", description: "Texto pronto para colar." });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-muran-primary/10 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-muran-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muran-complementary">Anúncios Ativos</h1>
            <p className="text-sm text-muted-foreground">
              Visualize e exporte os anúncios ativos do Meta Ads de cada cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Cliente */}
          <div className="md:col-span-4">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Select value={clientId} onValueChange={onChangeClient} disabled={loadingAccounts}>
              <SelectTrigger>
                <SelectValue placeholder={loadingAccounts ? "Carregando..." : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {clientsOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta (se múltiplas) */}
          <div className="md:col-span-3">
            <Label className="text-xs text-muted-foreground">Conta Meta</Label>
            <Select
              value={accountRowId}
              onValueChange={onChangeAccount}
              disabled={!clientId || accountsForClient.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={accountsForClient.length ? "Selecione" : "—"} />
              </SelectTrigger>
              <SelectContent>
                {accountsForClient.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_name || a.account_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buscar */}
          <div className="md:col-span-3">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome do anúncio ou campanha"
                className="pl-8"
              />
            </div>
          </div>

          {/* Campanhas */}
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Campanhas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={!campaignsList.length}>
                  <span className="truncate">
                    {campaignFilter.length === 0 ? "Todas" : `${campaignFilter.length} selec.`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2 max-h-[320px] overflow-y-auto">
                {campaignsList.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">Nenhuma campanha</div>
                ) : (
                  <>
                    <button
                      className="text-xs text-muran-primary mb-2 hover:underline"
                      onClick={() => setCampaignFilter([])}
                    >
                      Limpar
                    </button>
                    {campaignsList.map((c) => {
                      const checked = campaignFilter.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-start gap-2 py-1.5 px-1 hover:bg-muted rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              setCampaignFilter((prev) =>
                                v ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                              );
                            }}
                          />
                          <span className="text-sm leading-tight">{c.name}</span>
                        </label>
                      );
                    })}
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch id="paused" checked={includePaused} onCheckedChange={setIncludePaused} />
            <Label htmlFor="paused" className="text-sm cursor-pointer">Incluir pausados</Label>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={view === "gallery" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("gallery")}
              className={view === "gallery" ? "bg-muran-primary hover:bg-muran-primary/90" : ""}
            >
              <ImageIcon className="h-4 w-4 mr-1.5" />
              Galeria
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
              className={view === "table" ? "bg-muran-primary hover:bg-muran-primary/90" : ""}
            >
              Tabela
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={!accountRowId || isFetching}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1.5", isFetching && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              disabled={!data || filteredAds.length === 0}
            >
              Copiar lista
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!data || filteredAds.length === 0 || exporting}
              className="bg-muran-primary hover:bg-muran-primary/90"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Exportar PNG
            </Button>
          </div>
        </div>
      </div>

      {/* Estado vazio / loading / erro */}
      {!accountRowId && (
        <div className="bg-white rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Selecione um cliente para começar.
        </div>
      )}

      {accountRowId && isLoading && (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muran-primary" />
          Buscando anúncios...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Erro ao buscar anúncios: {(error as Error).message}
        </div>
      )}

      {/* Resultado exportável */}
      {data && !isLoading && (
        <div
          ref={exportRef}
          className="bg-white rounded-xl border border-border p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              {data.client.logo_url && (
                <img
                  src={data.client.logo_url}
                  alt={data.client.company_name}
                  className="h-12 w-12 rounded-lg object-contain bg-muted"
                  crossOrigin="anonymous"
                />
              )}
              <div>
                <div className="text-xl font-bold text-muran-complementary">
                  {data.client.company_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Conta: {data.account.account_name || data.account.account_id}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-muran-primary">{filteredAds.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {includePaused ? "Anúncios" : "Ativos"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>

          {filteredAds.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              Nenhum anúncio encontrado com os filtros atuais.
            </div>
          ) : view === "gallery" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2 w-16"></th>
                    <th className="p-2">Anúncio</th>
                    <th className="p-2">Campanha</th>
                    <th className="p-2 w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-t border-border">
                      <td className="p-2">
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                          {ad.image_url ? (
                            <img
                              src={proxiedImageUrl(ad.image_url)}
                              alt=""
                              className="h-full w-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{ad.name || "—"}</td>
                      <td className="p-2 text-muted-foreground">{ad.campaign_name || "—"}</td>
                      <td className="p-2">{statusBadge(ad.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: ActiveAd }) {
  const img = proxiedImageUrl(ad.image_url);
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-white flex flex-col">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={ad.name || ""}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        <div className="text-sm font-semibold text-muran-complementary line-clamp-2 leading-tight">
          {ad.name || "Sem nome"}
        </div>
        {ad.campaign_name && (
          <Badge variant="outline" className="text-[10px] font-normal max-w-full truncate inline-block">
            {ad.campaign_name}
          </Badge>
        )}
        <div className="mt-auto pt-1">{statusBadge(ad.status)}</div>
      </div>
    </div>
  );
}
