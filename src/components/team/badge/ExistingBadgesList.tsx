
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { BadgeItem } from "./badge-list/BadgeItem";
import { DeleteConfirmDialog } from "./badge-list/DeleteConfirmDialog";

interface ExistingBadgesListProps {
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
  }>;
  userBadges?: Array<{ code: string }>;
  onGiveBadge: (badge: any) => void;
  onDeleteBadge: (code: string, memberId?: string) => void;
  selectedMember: string;
  isLoading: boolean;
}

export function ExistingBadgesList({
  badges,
  userBadges,
  onGiveBadge,
  onDeleteBadge,
  selectedMember,
  isLoading,
}: ExistingBadgesListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<{ code: string; name: string } | null>(null);
  const [deleteType, setDeleteType] = useState<"member" | "all" | null>(null);

  const userHasBadge = (badgeCode: string) => {
    return userBadges?.some((badge) => badge.code === badgeCode);
  };

  const handleDeleteClick = (code: string, name: string, type: "member" | "all") => {
    setBadgeToDelete({ code, name });
    setDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!badgeToDelete) return;
    
    if (deleteType === "member") {
      onDeleteBadge(badgeToDelete.code, selectedMember);
    } else {
      onDeleteBadge(badgeToDelete.code);
    }
    
    setDeleteConfirmOpen(false);
    setBadgeToDelete(null);
    setDeleteType(null);
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Carregando emblemas...</div>;
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum emblema existente.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 gap-4">
          {badges.map((badge) => (
            <BadgeItem
              key={badge.id}
              badge={badge}
              userHasBadge={userHasBadge(badge.code)}
              selectedMember={selectedMember}
              onGiveBadge={() => onGiveBadge(badge)}
              onDeleteClick={(type) => handleDeleteClick(badge.code, badge.name, type)}
            />
          ))}
        </div>
      </ScrollArea>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        badgeName={badgeToDelete?.name}
        deleteType={deleteType}
      />
    </TooltipProvider>
  );
}
