import { useState, useEffect } from "react";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { AvailableParticipantsList } from "./AvailableParticipantsList";
import { ParticipantConfirmation } from "./ParticipantConfirmation";
import { ConfirmedParticipantsList } from "./ConfirmedParticipantsList";
import { ParticipantCostsManager } from "./ParticipantCostsManager";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ParticipantSelectionProps {
  availableParticipants: Array<{ id: string; name: string }>;
  selectedParticipants: string[];
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onToggleParticipant: (participantId: string) => void;
  onAddParticipant: (data: { name: string; email?: string }) => void;
  onSubmit: () => void;
  eventId: string | undefined;
}

interface ConfirmedParticipant {
  id: string;
  participant_id: string;
  participants: {
    id: string;
    name: string;
    email?: string;
  };
  totalCosts: number;
  balance: number;
}

export const ParticipantSelection = ({
  availableParticipants,
  selectedParticipants,
  isDialogOpen,
  setIsDialogOpen,
  onToggleParticipant,
  onAddParticipant,
  onSubmit,
  eventId,
}: ParticipantSelectionProps) => {
  const [selectedParticipantForCosts, setSelectedParticipantForCosts] =
    useState<{
      id: string;
      name: string;
    } | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel("event-participants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_participants",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["event-participants"] });
          queryClient.invalidateQueries({
            queryKey: ["confirmed-participants", eventId],
          });
          queryClient.invalidateQueries({
            queryKey: ["participants-count", eventId],
          });
          queryClient.invalidateQueries({
            queryKey: ["participant-costs", eventId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end mb-1">
        <AddParticipantDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={onAddParticipant}
        />
      </div>

      <div className="grid gap-1 md:grid-cols-2 flex-1">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg">
          <AvailableParticipantsList
            eventId={eventId}
            participants={availableParticipants}
            selectedParticipants={selectedParticipants}
            onToggleParticipant={onToggleParticipant}
          />
          <ParticipantConfirmation
            eventId={eventId}
            selectedParticipants={selectedParticipants}
          />
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg">
          <ConfirmedParticipantsList
            eventId={eventId}
            availableParticipants={availableParticipants}
            selectedParticipants={selectedParticipants}
            onSelectForCosts={(participant: ConfirmedParticipant) =>
              setSelectedParticipantForCosts({
                id: participant.participant_id,
                name: participant.participants.name,
              })
            }
          />
        </div>
      </div>

      {selectedParticipantForCosts && eventId && (
        <div className="mt-1">
          <ParticipantCostsManager
            eventId={eventId}
            participantId={selectedParticipantForCosts.id}
          />
        </div>
      )}
    </div>
  );
};
