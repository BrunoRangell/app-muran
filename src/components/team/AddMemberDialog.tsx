
import { UserPlus } from "lucide-react";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMemberDialog = ({ isOpen, onOpenChange }: AddMemberDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Adicionar Novo Membro
          </DialogTitle>
        </DialogHeader>
        <TeamMemberForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
