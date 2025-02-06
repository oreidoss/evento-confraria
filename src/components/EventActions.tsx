import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventActionsProps {
  eventId: string;
  status: string;
  onFinish: (eventId: string) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

export const EventActions = ({ eventId, status, onFinish, onDelete }: EventActionsProps) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await onDelete(eventId);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(`/selecionar-participantes/${eventId}`)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {status === 'active' && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary/80"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar Evento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja finalizar este evento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onFinish(eventId)}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};