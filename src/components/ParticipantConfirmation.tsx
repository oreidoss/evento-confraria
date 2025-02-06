import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ParticipantConfirmationProps {
  eventId: string | undefined;
  selectedParticipants: string[];
}

export const ParticipantConfirmation = ({
  eventId,
  selectedParticipants,
}: ParticipantConfirmationProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: participants } = useQuery({
    queryKey: ["participants", selectedParticipants],
    queryFn: async () => {
      if (selectedParticipants.length === 0) return [];
      
      const { data, error } = await supabase
        .from("participants")
        .select("id, name")
        .in("id", selectedParticipants);

      if (error) throw error;
      return data;
    },
    enabled: selectedParticipants.length > 0,
  });

  const confirmParticipantsMutation = useMutation({
    mutationFn: async () => {
      if (!participants || !eventId) {
        throw new Error("Dados inválidos para confirmação");
      }

      const participantsToAdd = selectedParticipants.map(participantId => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) throw new Error(`Participante ${participantId} não encontrado`);
        
        return {
          event_id: eventId,
          participant_id: participantId,
          participant_name: participant.name,
          status: 'confirmed' as const
        };
      });

      // Usando transação para garantir atomicidade
      const { error } = await supabase.rpc('confirm_participants', {
        participants_data: participantsToAdd
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
      queryClient.invalidateQueries({ queryKey: ["confirmed-participants"] });
      toast.success("Participantes confirmados com sucesso!");
      navigate(`/evento/${eventId}`);
    },
    onError: (error) => {
      console.error("Erro ao confirmar participantes:", error);
      toast.error("Erro ao confirmar participantes. Por favor, tente novamente.");
    },
  });

  const handleConfirmParticipants = () => {
    if (selectedParticipants.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }
    confirmParticipantsMutation.mutate();
  };

  return (
    <div className="pt-4">
      <Button
        className="w-full"
        onClick={handleConfirmParticipants}
        disabled={selectedParticipants.length === 0 || confirmParticipantsMutation.isPending}
      >
        {confirmParticipantsMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirmando...
          </>
        ) : (
          `Confirmar ${selectedParticipants.length} Participante${selectedParticipants.length > 1 ? 's' : ''}`
        )}
      </Button>
    </div>
  );
}