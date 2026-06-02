import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, RefreshCw, Search, Megaphone, Loader2, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
      // aguarda render que esconde colunas Imagem/Campanha
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  disabled={loadingAccounts}
                >
                  <span className="truncate">
                    {clientId
                      ? clientsOptions.find((c) => c.id === clientId)?.name || "Selecione um cliente"
                      : loadingAccounts
                      ? "Carregando..."
                      : "Selecione um cliente"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientsOptions.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => onChangeClient(c.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clientId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

          {/* Buscar */}
          <div className="md:col-span-3">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome do anúncio"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch id="paused" checked={includePaused} onCheckedChange={setIncludePaused} />
            <Label htmlFor="paused" className="text-sm cursor-pointer">Incluir pausados</Label>
          </div>

          <div className="flex items-center gap-1 ml-auto">
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
          className={cn(
            "bg-white rounded-xl border border-border p-6 space-y-4",
            exporting && "w-fit max-w-full"
          )}
        >
          <div
            className={cn(
              "flex items-center border-b border-border pb-4",
              exporting ? "gap-16" : "justify-between"
            )}
          >
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
            <div className={cn(exporting ? "ml-auto text-right" : "text-right")}>
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
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold w-px whitespace-nowrap text-muted-foreground">#</th>
                    <th className="px-3 py-2 font-semibold w-px whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 w-px"></th>
                    <th className="px-3 py-2 font-semibold w-px whitespace-nowrap">Anúncio</th>
                    {!exporting && <th className="px-3 py-2 font-semibold">Campanha</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad, idx) => (
                    <tr key={ad.id} className="border-t border-border align-middle">
                      <td className="px-3 py-2 w-px whitespace-nowrap text-muted-foreground tabular-nums text-right">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap w-px">{statusBadge(ad.status)}</td>
                      <td className="px-3 py-2 w-px">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden">
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
                      <td className="px-3 py-2 font-medium whitespace-nowrap w-px">{ad.name || "—"}</td>
                      {!exporting && (
                        <td
                          className="px-3 py-2 text-muted-foreground truncate max-w-0"
                          title={ad.campaign_name || ""}
                        >
                          {ad.campaign_name || "—"}
                        </td>
                      )}
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

