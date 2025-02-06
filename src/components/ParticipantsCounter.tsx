
import { Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ParticipantsCounterProps {
  eventId: string;
}

export const ParticipantsCounter = ({ eventId }: ParticipantsCounterProps) => {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["participants-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_participants")
        .select("*", { count: 'exact', head: true })
        .eq("event_id", eventId)
        .eq("status", "confirmed");

      if (error) throw error;
      return count || 0;
    },
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
        () => {
          queryClient.invalidateQueries({ queryKey: ["participants-count", eventId] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [eventId, queryClient]);

  return (
    <div className="flex items-center gap-3 bg-white rounded-full px-6 py-4 shadow-sm w-full max-w-md">
      <Users className="h-6 w-6 text-gray-500" />
      <span className="text-xl font-semibold">
        {count} participantes
      </span>
    </div>
  );
};
