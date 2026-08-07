import { Check, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { MemberAvatarStack } from "@/components/tasks/MemberAvatarStack";
import { TaskMember } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface Props {
  members: TaskMember[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Renderização do gatilho: "field" (formulários) ou "avatars" (inline). */
  variant?: "field" | "avatars";
  className?: string;
}

/** Seletor de múltiplos responsáveis (checkboxes, estilo ClickUp). */
export const AssigneeMultiSelect = ({
  members,
  value,
  onChange,
  variant = "field",
  className,
}: Props) => {
  const selected = members.filter((m) => value.includes(m.id));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "avatars" ? (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Alterar responsáveis"
            className={cn(
              "inline-flex items-center rounded p-[1px] outline-none transition-colors hover:bg-accent",
              className
            )}
          >
            <MemberAvatarStack members={selected} emptyPlaceholder />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-[13px]",
              className
            )}
          >
            {selected.length ? (
              <>
                <MemberAvatarStack members={selected} />
                <span className="truncate">
                  {selected.length === 1
                    ? selected[0].name
                    : `${selected.length} responsáveis`}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Plus className="h-3.5 w-3.5" /> Sem responsável
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="tasks-dark z-[70] max-h-[320px] w-[240px] overflow-y-auto p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mb-1 w-full rounded px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-accent"
          >
            Limpar responsáveis
          </button>
        )}
        {members.map((m) => {
          const active = value.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] hover:bg-accent"
            >
              <MemberAvatar member={m} className="h-[20px] w-[20px]" />
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
        {!members.length && (
          <p className="px-2 py-2 text-[12px] text-muted-foreground">Nenhum membro.</p>
        )}
      </PopoverContent>
    </Popover>
  );
};
