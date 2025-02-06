import { useState } from "react";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { AvailableParticipantsList } from "./AvailableParticipantsList";
import { ParticipantConfirmation } from "./ParticipantConfirmation";
import { ConfirmedParticipantsList } from "./ConfirmedParticipantsList";
import { ParticipantCostsManager } from "./ParticipantCostsManager";

interface ParticipantManagerProps {
  eventId: string | undefined;
  availableParticipants: Array<{ id: string; name: string }>;
  selectedParticipants: string[];
  onToggleParticipant: (participantId: string) => void;
  onAddParticipant: (data: { name: string; email?: string }) => void;
}

export const ParticipantManager = ({
  eventId,
  availableParticipants,
  selectedParticipants,
  onToggleParticipant,
  onAddParticipant,
}: ParticipantManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex justify-end mb-1">
        <AddParticipantDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={onAddParticipant}
        />
      </div>

      <div className="grid gap-1 md:grid-cols-2 min-h-0">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg flex flex-col min-h-0">
          <ConfirmedParticipantsList
            eventId={eventId}
            availableParticipants={availableParticipants}
            selectedParticipants={selectedParticipants}
            onSelectForCosts={(participant) => {
              const manager = document.querySelector('[data-participant-costs-manager]');
              if (manager) {
                manager.dispatchEvent(
                  new CustomEvent('selectParticipantForCosts', { detail: participant })
                );
              }
            }}
          />
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-lg">
          <AvailableParticipantsList
            participants={availableParticipants}
            selectedParticipants={selectedParticipants}
            onToggleParticipant={onToggleParticipant}
          />
          <ParticipantConfirmation
            eventId={eventId}
            selectedParticipants={selectedParticipants}
          />
        </div>
      </div>

      <div className="mt-1">
        <ParticipantCostsManager eventId={eventId} />
      </div>
    </div>
  );
};