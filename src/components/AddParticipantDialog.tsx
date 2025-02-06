import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewParticipantForm } from "@/components/NewParticipantForm";

interface AddParticipantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; email?: string }) => void;
}

export const AddParticipantDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
}: AddParticipantDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Participante
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Participante</DialogTitle>
        </DialogHeader>
        <NewParticipantForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};