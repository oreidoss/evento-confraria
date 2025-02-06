import { ParticipantCard } from "./ParticipantCard";
import { ParticipantListHeader } from "./ParticipantListHeader";

interface ExistingParticipantsListProps {
  participants: Array<{
    id: string;
    participant_id: string;
    participants: {
      id: string;
      name: string;
      email?: string;
    };
    totalCosts: number;
    balance: number;
  }>;
  onSelectForCosts: (participant: any) => void;
  onUnconfirm: (id: string) => void;
  eventId?: string;
}

export const ExistingParticipantsList = ({
  participants,
  onSelectForCosts,
  onUnconfirm,
  eventId,
}: ExistingParticipantsListProps) => {
  const totalCosts = participants.reduce((sum, p) => sum + (p.totalCosts || 0), 0);

  return (
    <div className="flex flex-col w-full">
      <ParticipantListHeader
        participantCount={participants.length}
        totalCosts={totalCosts}
        eventId={eventId}
      />
      <div className="space-y-2 mt-2">
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            id={participant.participant_id}
            name={participant.participants.name}
            email={participant.participants.email}
            totalCosts={participant.totalCosts}
            balance={participant.balance}
            onDelete={() => {}}
            onSelect={() => onSelectForCosts(participant)}
            onUnconfirm={onUnconfirm}
          />
        ))}
      </div>
    </div>
  );
};