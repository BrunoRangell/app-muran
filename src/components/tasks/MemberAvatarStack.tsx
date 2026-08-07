import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import { TaskMember } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface Props {
  members: TaskMember[];
  /** Máximo de avatares exibidos antes do "+N". */
  max?: number;
  className?: string;
  /** Placeholder quando não há responsáveis. */
  emptyPlaceholder?: boolean;
}

/** Pilha de avatares sobrepostos (vários responsáveis por tarefa). */
export const MemberAvatarStack = ({
  members,
  max = 3,
  className,
  emptyPlaceholder = false,
}: Props) => {
  if (!members.length) {
    if (!emptyPlaceholder) return null;
    return (
      <span
        className={cn(
          "inline-block h-[22px] w-[22px] rounded-full border border-dashed border-border",
          className
        )}
      />
    );
  }

  const shown = members.slice(0, max);
  const rest = members.length - shown.length;

  return (
    <span className="inline-flex items-center">
      {shown.map((m, i) => (
        <MemberAvatar
          key={m.id}
          member={m}
          className={cn("h-[22px] w-[22px]", i > 0 && "-ml-1.5", className)}
        />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "-ml-1.5 inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-accent text-[9px] font-semibold text-foreground",
            className
          )}
        >
          +{rest}
        </span>
      )}
    </span>
  );
};
