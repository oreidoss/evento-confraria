import { useState } from "react";
import { ParticipantSelection } from "./ParticipantSelection";

interface ParticipantManagerProps {
  eventId: string;
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
    <div className="container mx-auto py-6">
      <ParticipantSelection
        eventId={eventId}
        availableParticipants={availableParticipants}
        selectedParticipants={selectedParticipants}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onToggleParticipant={onToggleParticipant}
        onAddParticipant={onAddParticipant}
        onSubmit={() => {}}
      />
    </div>
  );
};
