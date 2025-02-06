import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface EventValueCardsProps {
  eventId: string;
}

export const EventValueCards = ({ eventId }: EventValueCardsProps) => {
  const queryClient = useQueryClient();

  const { data: eventData } = useQuery({
    queryKey: ["event-totals", eventId],
    queryFn: async () => {
      console.log("Fetching event totals for:", eventId);
      
      // Get confirmed participants count
      const { data: participants, error: participantsError } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("status", "confirmed");

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
        throw participantsError;
      }

      // Get total costs
      const { data: costs, error: costsError } = await supabase
        .from("detalhe_de_custo")
        .select("valor_por_participante")
        .eq("event_id", eventId);

      if (costsError) {
        console.error("Error fetching costs:", costsError);
        throw costsError;
      }

      const totalParticipants = participants?.length || 0;
      const totalCosts = costs?.reduce((sum, cost) => sum + Number(cost.valor_por_participante), 0) || 0;
      const splitAmount = totalParticipants > 0 ? totalCosts / totalParticipants : 0;

      console.log("Event totals calculated:", { totalParticipants, totalCosts, splitAmount });
      return { totalParticipants, totalCosts, splitAmount };
    },
    refetchInterval: 1000, // Refetch every second to ensure we're up to date
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  useEffect(() => {
    // Subscribe to changes in event_participants table
    const participantsChannel = supabase
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
          console.log("Real-time update received for participants:", payload);
          queryClient.invalidateQueries({ queryKey: ["event-totals", eventId] });
        }
      )
      .subscribe((status) => {
        console.log("Participants channel status:", status);
      });

    // Subscribe to changes in detalhe_de_custo table
    const costsChannel = supabase
      .channel('event-costs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detalhe_de_custo',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("Real-time update received for costs:", payload);
          queryClient.invalidateQueries({ queryKey: ["event-totals", eventId] });
        }
      )
      .subscribe((status) => {
        console.log("Costs channel status:", status);
      });

    return () => {
      console.log("Cleaning up Supabase channels");
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(costsChannel);
    };
  }, [eventId, queryClient]);

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
      <div className="flex flex-col items-center gap-2 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-600">Valor Total</h2>
        <span className="text-4xl font-bold">
          R$ {(eventData?.totalCosts || 0).toFixed(2).replace('.', ',')}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-600">Valor por Participante</h2>
        <span className="text-4xl font-bold">
          R$ {(eventData?.splitAmount || 0).toFixed(2).replace('.', ',')}
        </span>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-3 bg-white rounded-full px-6 py-4 shadow-sm">
        <Users className="h-6 w-6 text-gray-500" />
        <span className="text-xl font-semibold">
          {eventData?.totalParticipants || 0} participantes
        </span>
      </div>
    </div>
  );
};