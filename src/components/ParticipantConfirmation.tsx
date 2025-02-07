import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DatabaseTypes } from "@/types/database.types";

interface ParticipantConfirmationProps {
  eventId: string | undefined;
  selectedParticipants: string[];
}

type ConfirmParticipantsArgs =
  DatabaseTypes["public"]["Functions"]["confirm_participants"]["Args"];

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

      const participantsToAdd = selectedParticipants.map((participantId) => {
        const participant = participants.find((p) => p.id === participantId);
        if (!participant)
          throw new Error(`Participante ${participantId} não encontrado`);

        return {
          event_id: eventId,
          participant_id: participantId,
          participant_name: participant.name,
          status: "confirmed" as const,
        };
      });

      const { error } = await supabase.rpc("confirm_participants", {
        participants_data: participantsToAdd,
      } as ConfirmParticipantsArgs);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
      toast.success("Participantes confirmados com sucesso!");
      navigate("/");
    },
    onError: (error) => {
      console.error("Erro ao confirmar participantes:", error);
      toast.error("Erro ao confirmar participantes");
    },
  });

  const handleConfirmParticipants = () => {
    confirmParticipantsMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={handleConfirmParticipants}
        disabled={confirmParticipantsMutation.isPending}
      >
        {confirmParticipantsMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Confirmar Participantes
      </Button>
    </div>
  );
};
