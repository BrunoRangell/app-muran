
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trophy, Trash2, XCircle } from "lucide-react";
import { BADGE_ICONS } from "../constants/badgeIcons";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
          {badges.map((badge) => {
            const badgeIconData = BADGE_ICONS.find(icon => icon.name === badge.icon);
            const badgeIconEmoji = badgeIconData?.icon || "🏆";
            
            return (
              <div
                key={badge.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muran-primary/10 rounded-lg">
                    <span role="img" aria-label={badge.name} className="text-2xl">
                      {badgeIconEmoji}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{badge.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedMember && (
                          <>
                            {userHasBadge(badge.code) ? (
                              <>
                                <UIBadge variant="secondary" className="shrink-0">
                                  Usuário possui
                                </UIBadge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                      onClick={() => handleDeleteClick(badge.code, badge.name, "member")}
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover emblema deste membro</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => onGiveBadge(badge)}
                              >
                                Dar emblema
                              </Button>
                            )}
                          </>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              onClick={() => handleDeleteClick(badge.code, badge.name, "all")}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir emblema de todos os membros</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "member" ? (
                <>
                  Tem certeza que deseja remover o emblema "{badgeToDelete?.name}" deste membro?
                  <br />
                  Esta ação não pode ser desfeita.
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir o emblema "{badgeToDelete?.name}" de todos os membros?
                  <br />
                  Esta ação não pode ser desfeita e removerá o emblema de todos os membros que o possuem.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
