import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  name: string;
}

interface AvailableParticipantsListProps {
  eventId?: string;
  participants: Participant[];
  selectedParticipants: string[];
  onToggleParticipant: (participantId: string) => void;
}

export const AvailableParticipantsList = ({
  eventId,
  participants,
  selectedParticipants,
  onToggleParticipant,
}: AvailableParticipantsListProps) => {
  const { data: eventParticipants } = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      console.log("Fetching event participants for event:", eventId);
      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          participant_id,
          participant_name,
          status
        `)
        .eq("event_id", eventId);

      if (error) {
        console.error("Error fetching event participants:", error);
        throw error;
      }
      console.log("Event participants data:", data);
      return data;
    },
    enabled: !!eventId,
  });

  // Filter out both selected and confirmed participants
  const availableParticipants = participants.filter(
    (participant) => {
      const eventParticipant = eventParticipants?.find(
        ep => ep.participant_id === participant.id
      );
      return !eventParticipant || eventParticipant.status === 'pending';
    }
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs font-semibold text-destructive">
        <UserPlus className="h-3 w-3" />
        Participantes não confirmados
      </div>
      {availableParticipants.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Não há participantes pendentes de confirmação.
        </p>
      ) : (
        <div className="space-y-1">
          {availableParticipants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center space-x-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all"
            >
              <Checkbox
                id={participant.id}
                checked={selectedParticipants.includes(participant.id)}
                onCheckedChange={() => onToggleParticipant(participant.id)}
              />
              <label
                htmlFor={participant.id}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {participant.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};