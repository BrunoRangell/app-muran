import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface ClientOption {
  id: string;
  company_name: string;
}

interface ClientComboboxProps {
  clients: ClientOption[];
  value: string;
  onChange: (id: string) => void;
}

export function ClientCombobox({ clients, value, onChange }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);

  const selected = clients.find((c) => c.id === value);
  const q = normalize(search.trim());
  const filtered = q ? clients.filter((c) => normalize(c.company_name).includes(q)) : clients;

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      const idx = filtered.findIndex((c) => c.id === value);
      setActive(idx >= 0 ? idx : 0);
    } else {
      setSearch("");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleOpenChange(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active].id);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Cliente"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">{selected?.company_name ?? "Selecione um cliente"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      {/* Sem Portal: renderiza dentro do Dialog, evitando o bloqueio de rolagem/cliques */}
      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        collisionPadding={12}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector("input")?.focus();
        }}
        className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Pesquisar cliente..."
            className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div
          role="listbox"
          className="max-h-64 overflow-y-auto overscroll-contain p-1"
          onWheel={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          ) : (
            filtered.map((client, i) => (
              <div
                key={client.id}
                role="option"
                aria-selected={client.id === value}
                ref={i === active ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(client.id)}
                className={cn(
                  "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm",
                  i === active && "bg-accent text-accent-foreground"
                )}
              >
                <Check className={cn("mr-2 h-4 w-4 shrink-0", client.id === value ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{client.company_name}</span>
              </div>
            ))
          )}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
