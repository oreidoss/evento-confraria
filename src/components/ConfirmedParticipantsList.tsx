import { ExistingParticipantsList } from "./ExistingParticipantsList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

interface ConfirmedParticipantsListProps {
  eventId: string | undefined;
  availableParticipants: Array<{ id: string; name: string }>;
  selectedParticipants: string[];
  onSelectForCosts: (participant: any) => void;
}

export const ConfirmedParticipantsList = ({
  eventId,
  availableParticipants,
  selectedParticipants,
  onSelectForCosts,
}: ConfirmedParticipantsListProps) => {
  const queryClient = useQueryClient();

  const { data: eventParticipants } = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      console.log("Fetching confirmed participants for event:", eventId);

      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          id,
          participant_id,
          participant_name,
          status,
          participants (
            id,
            name,
            email
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "confirmed");

      if (error) {
        console.error("Error fetching confirmed participants:", error);
        throw error;
      }

      console.log("Raw confirmed participants data:", data);
      
      // Filter out any null values and ensure status is "confirmed"
      const confirmedParticipants = data.filter(
        (participant) => participant.status === "confirmed" && participant.participants
      );
      
      console.log("Filtered confirmed participants:", confirmedParticipants);
      return confirmedParticipants;
    },
    enabled: !!eventId,
  });

  const { data: participantCosts } = useQuery({
    queryKey: ["participant-costs", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data: costsData, error } = await supabase
        .from("detalhe_de_custo")
        .select("*")
        .eq("event_id", eventId);

      if (error) {
        console.error("Error fetching participant costs:", error);
        throw error;
      }

      console.log("Participant costs data:", costsData);
      return costsData;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    const channel = supabase
      .channel('event-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
          queryClient.invalidateQueries({ queryKey: ["participants-count", eventId] });
          queryClient.invalidateQueries({ queryKey: ["participant-costs", eventId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  const totalCosts = participantCosts?.reduce((sum, cost) => sum + Number(cost.valor_por_participante), 0) || 0;
  const participantCount = eventParticipants?.length || 0;
  const splitAmount = participantCount > 0 ? totalCosts / participantCount : 0;

  const confirmedParticipants = eventParticipants?.map(participant => {
    const participantTotalCosts = participantCosts
      ?.filter(cost => cost.participant_id === participant.participant_id)
      .reduce((sum, cost) => sum + Number(cost.valor_por_participante), 0) || 0;

    return {
      id: participant.id,
      participant_id: participant.participant_id,
      participants: {
        id: participant.participants?.id,
        name: participant.participant_name || participant.participants?.name,
        email: participant.participants?.email
      },
      totalCosts: participantTotalCosts,
      balance: participantTotalCosts - splitAmount
    };
  }) || [];

  const handleUnconfirm = async (participantId: string) => {
    try {
      console.log("Unconfirming participant:", participantId);
      const { error } = await supabase
        .from("event_participants")
        .update({ status: "pending" })
        .eq("participant_id", participantId)
        .eq("event_id", eventId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
      queryClient.invalidateQueries({ queryKey: ["participant-costs"] });
      queryClient.invalidateQueries({ queryKey: ["participants-count"] });
      toast.success("Participação cancelada com sucesso");
    } catch (error) {
      console.error("Error unconfirming participant:", error);
      toast.error("Erro ao cancelar participação");
    }
  };

  return confirmedParticipants.length > 0 ? (
    <div className="flex-1">
      <ExistingParticipantsList
        participants={confirmedParticipants}
        onSelectForCosts={onSelectForCosts}
        onUnconfirm={handleUnconfirm}
        eventId={eventId}
      />
    </div>
  ) : null;
};