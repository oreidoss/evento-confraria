
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ParticipantListHeaderProps {
  eventId: string;
  participantCount: number;
  totalCosts: number;
}

export const ParticipantListHeader = ({
  eventId,
  participantCount,
  totalCosts,
}: ParticipantListHeaderProps) => {
  const queryClient = useQueryClient();

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
        () => {
          console.log("Real-time update in ParticipantListHeader");
          queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
          queryClient.invalidateQueries({ queryKey: ["participants-count", eventId] });
          queryClient.invalidateQueries({ queryKey: ["confirmed-participants", eventId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Participantes confirmados</h2>
        <span className="text-xs text-muted-foreground">
          Total: {participantCount} {participantCount === 1 ? 'participante' : 'participantes'}
        </span>
      </div>
      {totalCosts > 0 && (
        <p className="text-xs text-muted-foreground">
          Custos totais: R$ {totalCosts.toFixed(2)}
        </p>
      )}
    </div>
  );
};
